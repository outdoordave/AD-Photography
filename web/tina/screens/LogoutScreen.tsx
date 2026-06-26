import React from 'react';

// „Abmelden" — sauberer Logout-Menüpunkt in der CMS-Seitenleiste (Kategorie „Site").
// Tinas eingebauter Logout wirft danach gern einen Fehler / lässt einen auf einer
// kaputten Seite zurück. Hier stattdessen: alle Tina-Tokens (localStorage/sessionStorage)
// löschen und direkt auf die Startseite „/" gehen. Kein Tina-Fehler, definierter Landeplatz.

function clearTinaAuth() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /tina/i.test(k)) localStorage.removeItem(k);
    }
  } catch (e) { /* ignore */ }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && /tina/i.test(k)) sessionStorage.removeItem(k);
    }
  } catch (e) { /* ignore */ }
}

const Logout: React.FC<{ close: () => void }> = () => {
  React.useEffect(() => {
    clearTinaAuth();
    try { window.location.assign('/'); } catch (e) { /* Fallback-Link greift */ }
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48, fontFamily: 'system-ui, sans-serif', color: '#3a2e26', textAlign: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Abgemeldet — zurück zur Startseite …</div>
      <a href="/" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: '#7a5c43', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
        Zur Startseite
      </a>
    </div>
  );
};

const LogoutIcon = (props: any) =>
  React.createElement(
    'svg',
    { viewBox: '0 0 24 24', width: '1em', height: '1em', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...props },
    React.createElement('path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    React.createElement('path', { d: 'M16 17l5-5-5-5M21 12H9', strokeLinecap: 'round', strokeLinejoin: 'round' })
  );

// ScreenPlugin-Objekt (wie BackToSiteScreen; tinacms exportiert createScreen nicht öffentlich).
export const logoutScreen: any = {
  __type: 'screen',
  name: 'Abmelden',
  Icon: LogoutIcon,
  layout: 'popup',
  navCategory: 'Website',
  Component: (screenProps: { close: () => void }) => React.createElement(Logout, screenProps),
};
