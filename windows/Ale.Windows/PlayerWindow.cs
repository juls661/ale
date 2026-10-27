using System.Diagnostics;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Ale.Windows;
internal sealed class PlayerWindow : Form
{
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill };
    private readonly HashSet<Form> popups = [];
    private CoreWebView2Environment? environment;
    private string webRoot = "";
    private bool clearing;
    private readonly string profilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Ale", "WebView2");
    public PlayerWindow()
    {
        Text = "Ale — Your listening space";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        Size = new Size(1280, 880);
        MinimumSize = new Size(420, 600);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(19, 21, 21);
        Controls.Add(browser);
        Shown += Initialize;
        FormClosed += (_, _) => { foreach (var popup in popups.ToArray()) popup.Close(); browser.Dispose(); };
    }
    private async void Initialize(object? sender, EventArgs args)
    {
        try
        {
            webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            if (!File.Exists(Path.Combine(webRoot, "index.html"))) throw new FileNotFoundException("Ale's interface is missing. Extract the entire download before opening Ale.exe.");
            environment = await CoreWebView2Environment.CreateAsync(userDataFolder: profilePath);
            await browser.EnsureCoreWebView2Async(environment);
            Secure(browser.CoreWebView2, false);
            browser.CoreWebView2.SetVirtualHostNameToFolderMapping("ale.example", webRoot, CoreWebView2HostResourceAccessKind.DenyCors);
            browser.CoreWebView2.NavigationStarting += (_, e) =>
            {
                if (NavigationPolicy.IsLocal(e.Uri) || (clearing && e.Uri == "about:blank")) return;
                e.Cancel = true;
                if (e.IsUserInitiated && NavigationPolicy.IsExternalLink(e.Uri)) OpenExternal(e.Uri);
            };
            browser.CoreWebView2.NewWindowRequested += OpenPopup;
            browser.CoreWebView2.WebMessageReceived += async (_, e) =>
            {
                if (!NavigationPolicy.IsLocal(e.Source) || clearing) return;
                try
                {
                    using var message = JsonDocument.Parse(e.WebMessageAsJson);
                    if (message.RootElement.TryGetProperty("type", out var type) && type.GetString() == "clear-profile") await ClearProfile();
                }
                catch (JsonException) { /* Reject malformed page messages. */ }
            };
            browser.CoreWebView2.Navigate(NavigationPolicy.Origin + "/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show("Ale needs Microsoft's Evergreen WebView2 Runtime. Install it from https://developer.microsoft.com/microsoft-edge/webview2/ and reopen Ale.", "WebView2 required", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
        }
        catch (Exception error)
        {
            MessageBox.Show("Ale could not start. " + error.Message, "Ale startup", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }
    private static void Secure(CoreWebView2 core, bool popup)
    {
        core.Settings.AreHostObjectsAllowed = false;
        core.Settings.IsWebMessageEnabled = !popup;
        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsZoomControlEnabled = true;
#if !DEBUG
        core.Settings.AreDevToolsEnabled = false;
#endif
        core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
        core.DownloadStarting += (_, e) => e.Cancel = true;
        core.ServerCertificateErrorDetected += (_, e) => e.Action = CoreWebView2ServerCertificateErrorAction.Cancel;
    }
    private async void OpenPopup(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        e.Handled = true;
        if (clearing) return;
        if (NavigationPolicy.IsExternalLink(e.Uri) && !NavigationPolicy.IsApple(e.Uri)) { OpenExternal(e.Uri); return; }
        // MusicKit may first open a blank/local window before submitting its authorization form to Apple.
        if (e.Uri != "about:blank" && !NavigationPolicy.IsApple(e.Uri) && !NavigationPolicy.IsLocal(e.Uri)) return;
        var deferral = e.GetDeferral();
        Form? popup = null;
        try
        {
            if (popups.Count >= 3) return;
            popup = new Form { Text = "Apple Music — Sign in", Size = new Size(520, 740), MinimumSize = new Size(400, 500), StartPosition = FormStartPosition.CenterParent };
            var auth = new WebView2 { Dock = DockStyle.Fill };
            popup.Controls.Add(auth);
            await auth.EnsureCoreWebView2Async(environment);
            Secure(auth.CoreWebView2, true);
            auth.CoreWebView2.SetVirtualHostNameToFolderMapping("ale.example", webRoot, CoreWebView2HostResourceAccessKind.DenyCors);
            auth.CoreWebView2.NavigationStarting += (_, nav) => { if (nav.Uri != "about:blank" && !NavigationPolicy.IsApple(nav.Uri) && !NavigationPolicy.IsLocal(nav.Uri)) nav.Cancel = true; };
            auth.CoreWebView2.NewWindowRequested += (_, child) => child.Handled = true;
            auth.CoreWebView2.WindowCloseRequested += (_, _) => popup.Close();
            auth.CoreWebView2.DocumentTitleChanged += (_, _) => popup.Text = "Apple Music — " + auth.CoreWebView2.DocumentTitle;
            popup.FormClosed += (_, _) => { popups.Remove(popup); auth.Dispose(); };
            popups.Add(popup);
            // Assigning the new CoreWebView2 preserves window.opener for MusicKit's postMessage authorization flow.
            e.NewWindow = auth.CoreWebView2;
            popup.Show(this);
        }
        catch { popup?.Dispose(); MessageBox.Show("The Apple sign-in window could not open. Try again.", "Ale", MessageBoxButtons.OK, MessageBoxIcon.Information); }
        finally { deferral.Complete(); }
    }
    private async Task ClearProfile()
    {
        clearing = true;
        try
        {
            foreach (var popup in popups.ToArray()) popup.Close();
            browser.CoreWebView2.Navigate("about:blank");
            await browser.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.AllProfile);
            MessageBox.Show("Ale's browser profile has been cleared. Ale will now close.", "Ale privacy", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
        }
        catch { clearing = false; MessageBox.Show("Ale could not clear its browser profile. Close Ale and remove %LOCALAPPDATA%\\Ale\\WebView2 to clear it manually.", "Ale privacy", MessageBoxButtons.OK, MessageBoxIcon.Error); }
    }
    private static void OpenExternal(string uri)
    {
        try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); }
        catch { MessageBox.Show("The link could not open in your default browser.", "Ale"); }
    }
}
