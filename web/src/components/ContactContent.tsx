import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { socialIcon } from '../lib/socialIcons';

// Kontakt als React-Insel (wie Stories/Gear/About): useTina = LIVE-Daten, data-tina-
// field = Klick-ins-Feld. Aufbau 1:1 wie #page-contact: Seitenkopf + 2 Spalten
// (links Direkt-Block + Kanal-Liste, rechts Formular). Formular ist VORSCHAU —
// prueft auf gefuellte Felder (sonst Alert), zeigt Erfolgs-Meldung, leert die Felder;
// es versendet (wie die Live-Seite) NICHTS.

type Props = {
  query: string;
  variables: object;
  data: any;
  lang: 'de' | 'en';
};

export default function ContactContent(props: Props) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const c = (data.kontakt ?? {}) as Record<string, any>;
  const lang = props.lang;
  // Flache Felder (base_de/base_en): EN fällt auf DE zurück.
  const t = (o: any, base: string) => { if (!o) return ''; const de = o[base + '_de'], en = o[base + '_en']; return lang === 'en' ? (en || de || '') : (de || ''); };
  const tf = (o: any, base: string) => tinaField(o, (lang === 'en' ? base + '_en' : base + '_de') as any);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const onSend = () => {
    if (!name.trim() || !email.trim() || !msg.trim()) {
      alert(lang === 'de' ? 'Bitte fülle alle Felder aus.' : 'Please fill in all fields.');
      return;
    }
    setSent(true);
    setName('');
    setEmail('');
    setMsg('');
  };

  const channels: any[] = Array.isArray(c.channels) ? c.channels : [];
  const locTxt = t(c, 'location');

  return (
    <>
      <div className="wrap">
        <div className="page-title">
          <div className="kicker" data-tina-field={tf(c, 'kicker')}>{t(c, 'kicker')}</div>
          <h1 data-tina-field={tf(c, 'title')}>{t(c, 'title')}</h1>
          <p data-tina-field={tf(c, 'intro')}>{t(c, 'intro')}</p>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="contact-grid">
            {/* Links: Direkt-Block + Kanäle */}
            <div className="contact-info">
              <h3 data-tina-field={tf(c, 'direct_title')}>{t(c, 'direct_title')}</h3>
              <p data-tina-field={tf(c, 'direct_text')}>{t(c, 'direct_text')}</p>
              <div data-tina-field={tinaField(c, 'channels')}>
                {channels.map((ch, i) => {
                  const inner = (
                    <>
                      <span className="ic ww-social-ic" dangerouslySetInnerHTML={{ __html: socialIcon(ch?.type) }} />
                      {ch?.label}
                    </>
                  );
                  return ch?.url ? (
                    <a className="line ww-channel" href={ch.url} target="_blank" rel="noopener" key={i}>{inner}</a>
                  ) : (
                    <div className="line ww-channel" key={i}>{inner}</div>
                  );
                })}
                {locTxt ? (
                  <div className="line ww-channel" data-tina-field={tf(c, 'location')}>
                    <span className="ic ww-social-ic" dangerouslySetInnerHTML={{ __html: socialIcon('web') }} />
                    {locTxt}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Rechts: Formular (Vorschau) */}
            <div className="contact-form">
              <div className={`form-success${sent ? ' show' : ''}`} data-tina-field={tf(c, 'form_success')}>{t(c, 'form_success')}</div>
              <div className="form-field">
                <label data-tina-field={tf(c, 'form_name')}>{t(c, 'form_name')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label data-tina-field={tf(c, 'form_email')}>{t(c, 'form_email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-field">
                <label data-tina-field={tf(c, 'form_message')}>{t(c, 'form_message')}</label>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} />
              </div>
              <button type="button" className="btn dark" data-tina-field={tf(c, 'form_send')} onClick={onSend}>{t(c, 'form_send')}</button>
              <p className="form-note" data-tina-field={tf(c, 'form_note')}>{t(c, 'form_note')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
