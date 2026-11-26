package com.livre.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Mise à jour intégrée : télécharge le nouvel APK dans le cache de l'application
 * puis ouvre l'installateur Android, sans passer par le navigateur.
 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private static final int MAX_REDIRECTS = 5;

    /** Niveau des fonctions natives de cet APK (native-api.txt). */
    @PluginMethod
    public void info(PluginCall call) {
        JSObject ret = new JSObject();
        int api = 0;
        try {
            api = Integer.parseInt(getContext().getString(R.string.native_api).trim());
        } catch (Exception ignored) {
        }
        ret.put("nativeApi", api);
        call.resolve(ret);
    }

    /** Indique si l'application a le droit d'installer des mises à jour (Android 8+). */
    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("allowed", canRequestInstalls());
        call.resolve(ret);
    }

    /** Ouvre le réglage « Installer des applications inconnues » pour Livre. */
    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    /** Télécharge l'APK (événements « progress ») puis lance l'installation. */
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("URL de mise à jour invalide");
            return;
        }
        if (!canRequestInstalls()) {
            call.reject("Autorisation d'installation requise", "INSTALL_PERMISSION");
            return;
        }
        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                File dir = new File(getContext().getCacheDir(), "updates");
                if (!dir.exists() && !dir.mkdirs()) throw new Exception("Stockage indisponible");
                File apk = new File(dir, "Livre-update.apk");
                if (apk.exists()) apk.delete();

                // Suit les redirections (GitHub renvoie vers son stockage de fichiers).
                URL current = new URL(url);
                for (int i = 0; ; i++) {
                    conn = (HttpURLConnection) current.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(30000);
                    int code = conn.getResponseCode();
                    if (code >= 300 && code < 400) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location == null || i >= MAX_REDIRECTS) throw new Exception("Redirection invalide");
                        current = new URL(current, location);
                        if (!"https".equals(current.getProtocol())) throw new Exception("Téléchargement non sécurisé refusé");
                        continue;
                    }
                    if (code != 200) throw new Exception("Téléchargement impossible (" + code + ")");
                    break;
                }

                long total = conn.getContentLengthLong();
                long done = 0;
                int lastPercent = -1;
                try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        out.write(buf, 0, n);
                        done += n;
                        if (total > 0) {
                            int percent = (int) (done * 100 / total);
                            if (percent != lastPercent) {
                                lastPercent = percent;
                                JSObject p = new JSObject();
                                p.put("progress", percent);
                                notifyListeners("progress", p);
                            }
                        }
                    }
                }

                if (total > 0 && done != total) throw new Exception("Téléchargement incomplet, réessayez");

                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                install.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
                // Lancé depuis l'activité, au premier plan : certains Android (Xiaomi / HyperOS)
                // ignorent silencieusement les ouvertures faites depuis un fil d'arrière-plan.
                final Intent toStart = install;
                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(toStart);
                        call.resolve();
                    } catch (Exception e) {
                        call.reject("Impossible d'ouvrir l'installateur", "NO_INSTALLER");
                    }
                });
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Mise à jour impossible");
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }

    private boolean canRequestInstalls() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return getContext().getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }
}
