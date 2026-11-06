package com.motoraa.franchisekr;

import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/** frkr 메인 화면(WebView). 네이티브 플러그인 2개(빌드 정보, 보안 저장소)를 등록. 로그인 없음(BYOK 앱). */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AABuildPlugin.class);  // debug/release 구분(광고 단위·버전 표시·업데이트 안내)
        registerPlugin(AASecurePlugin.class); // API 키: Android Keystore(AES-GCM) 암호화 저장
        super.onCreate(savedInstanceState);
        applyInsets();
    }

    /**
     * Android 15+(targetSdk 35+)는 화면 전체 사용(edge-to-edge)이 강제되어 windowSoftInputMode=adjustResize 가 먹지 않고 키보드가 화면 위를 덮음.
     * 그래서 상태바·내비게이션 바·노치·키보드(IME) 인셋을 직접 합쳐서 content 뷰의 패딩으로 적용 → WebView 가 키보드 위까지로 줄어듦(웹의 100% 높이 화면이 같이 줄어듦).
     * (Capacitor 의 adjustMarginsForEdgeToEdge 는 키보드를 빼고 계산하므로 "disable" 로 끄고 여기서 처리). 14 이하는 기존 adjustResize 가 정상 동작하므로 건드리지 않음.
     */
    private void applyInsets() {
        if (Build.VERSION.SDK_INT < 35) return;
        View content = findViewById(android.R.id.content);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, w) -> {
            Insets bars = w.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = w.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom)); // IME 인셋은 내비게이션 바 높이를 이미 포함 → 큰 쪽만
            return WindowInsetsCompat.CONSUMED;
        });
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), content);
        c.setAppearanceLightStatusBars(!night); c.setAppearanceLightNavigationBars(!night);
        ViewCompat.requestApplyInsets(content);
    }

}
