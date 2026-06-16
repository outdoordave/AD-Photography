import React from 'react';

// „Zur Website" — globaler Menüpunkt in der CMS-Seitenleiste (Kategorie „Site").
// TinaCMS exportiert `createScreen` nicht öffentlich, deshalb bauen wir das
// ScreenPlugin-Objekt 1:1 selbst (siehe tinacms intern: __type:'screen').
// Verhalten: Beim Öffnen sofort zurück zur Website (gleicher Origin, „/").
// Sichtbarer Fallback-Link, falls die automatische Weiterleitung blockiert ist.

const BackToSite: React.FC<{ close: () => void }> = () => {
  React.useEffect(() => {
    try {
      window.location.assign('/');
    } catch (e) {
      /* ignore — Fallback-Link greift */
    }
  }, []);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 48,
        fontFamily: 'system-ui, sans-serif',
        color: '#3a2e26',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600 }}>Zurück zur Website …</div>
      <a
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 18px',
          borderRadius: 8,
          background: '#7a5c43',
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Website öffnen
      </a>
      <a
        href="/"
        target="_blank"
        rel="noopener"
        style={{ color: '#7a5c43', fontSize: 13, textDecoration: 'underline' }}
      >
        … oder in neuem Tab öffnen
      </a>
    </div>
  );
};

const WebsiteIcon = (props: any) =>
  React.createElement(
    'svg',
    { viewBox: '0 0 24 24', width: '1em', height: '1em', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...props },
    React.createElement('path', { d: 'M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18', strokeLinecap: 'round' }),
    React.createElement('circle', { cx: 12, cy: 12, r: 9 })
  );

// ScreenPlugin-Objekt (entspricht dem Rückgabewert von tinacms' interner createScreen).
export const backToSiteScreen: any = {
  __type: 'screen',
  name: 'Zur Website',
  Icon: WebsiteIcon,
  layout: 'popup',
  navCategory: 'Site',
  Component: (screenProps: { close: () => void }) => React.createElement(BackToSite, screenProps),
};
