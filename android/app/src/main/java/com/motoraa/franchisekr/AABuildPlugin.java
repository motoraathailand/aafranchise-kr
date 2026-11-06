package com.motoraa.franchisekr;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** 이 앱이 debug 인지 release 인지, 버전이 몇인지 웹에 알려 줌. 웹은 release 에서는 (실제 광고 단위가 준비되기 전까지) 광고를 쓰지 않고, debug 에서는 구글 테스트 단위만 씀. */
@CapacitorPlugin(name = "AABuild")
public class AABuildPlugin extends Plugin {
    @PluginMethod
    public void getInfo(PluginCall call) {
        JSObject r = new JSObject();
        r.put("debug", BuildConfig.DEBUG);
        r.put("versionName", BuildConfig.VERSION_NAME);
        r.put("versionCode", BuildConfig.VERSION_CODE);
        call.resolve(r);
    }
}
