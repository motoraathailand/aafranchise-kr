package com.motoraa.franchisekr;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * API 키 같은 비밀값을 기기 안에만 저장: AES-256-GCM 키는 Android Keystore(하드웨어/TEE 지원) 안에서만 존재하고,
 * 암호문(iv:ciphertext, Base64)만 앱 전용 SharedPreferences 에 둔다. 평문 저장·로그·백업(allowBackup=false)·서버 전송 없음.
 * 실패하면 reject(웹은 평문으로 대체하지 않고 사용자에게 오류를 보여 줌).
 */
@CapacitorPlugin(name = "AASecure")
public class AASecurePlugin extends Plugin {
    private static final String ALIAS = "fr_secure_v1";
    private static final String PREFS = "fr_secure_v1";

    private SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) return (SecretKey) ks.getKey(ALIAS, null);
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        kg.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return kg.generateKey();
    }

    private SharedPreferences prefs() { return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    private String enc(String plain) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, key());
        byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
        return Base64.encodeToString(c.getIV(), Base64.NO_WRAP) + ":" + Base64.encodeToString(ct, Base64.NO_WRAP);
    }

    private String dec(String stored) throws Exception {
        int i = stored.indexOf(':');
        byte[] iv = Base64.decode(stored.substring(0, i), Base64.NO_WRAP);
        byte[] ct = Base64.decode(stored.substring(i + 1), Base64.NO_WRAP);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
        return new String(c.doFinal(ct), StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String k = call.getString("key"), v = call.getString("value");
        if (k == null || v == null) { call.reject("key/value required"); return; }
        try { prefs().edit().putString(k, enc(v)).apply(); call.resolve(); }
        catch (Exception e) { call.reject("secure store failed"); }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String k = call.getString("key");
        if (k == null) { call.reject("key required"); return; }
        String s = prefs().getString(k, null);
        JSObject r = new JSObject();
        if (s == null) { r.put("value", JSObject.NULL); call.resolve(r); return; }
        try { r.put("value", dec(s)); call.resolve(r); }
        catch (Exception e) { prefs().edit().remove(k).apply(); r.put("value", JSObject.NULL); call.resolve(r); } // 키스토어 키가 사라졌으면(앱 데이터 삭제 등) 값도 버림
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String k = call.getString("key");
        if (k != null) prefs().edit().remove(k).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) { prefs().edit().clear().apply(); call.resolve(); }

    @PluginMethod
    public void keys(PluginCall call) {
        JSArray a = new JSArray();
        for (Map.Entry<String, ?> e : prefs().getAll().entrySet()) a.put(e.getKey());
        JSObject r = new JSObject();
        r.put("keys", a);
        call.resolve(r);
    }
}
