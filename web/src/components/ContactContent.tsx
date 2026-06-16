import React from 'react';
import { useTina, tinaField } from 'tinacms/dist/react';
import { socialIcon } from '../lib/socialIcons';

// Kontakt als React-Insel (wie Stories/Gear/About): useTina = LIVE-Daten, data-tina-
// field = Klick-ins-Feld. Aufbau 1:1 wie #page-contact: Seitenkopf + 2 Spalten
// (links Direkt-Block + Kanal-Liste, rechts Formular).
// Formular-Versand (W5): wenn im CMS ein Web3Forms-Access-Key hinterlegt ist
// (form_access_key), sendet das Formular die Nachricht per POST an api.web3forms.com
// → landet im Postfach, das beim Key hinterlegt wurde. Ohne Key bleibt es „Vorschau"
// (prüft Felder, zeigt Erfolg, sendet nichts) — so bricht nichts, bevor der Key da ist.
// Datenschutz: Pflicht-Häkchen vor dem Senden. Spam-Schutz: verstecktes Honeypot-Feld.

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
  const [consent, setConsent] = React.useState(false);
  const [honey, setHoney] = React.useState(''); // Honeypot: von Menschen unsichtbar, nur Bots füllen es
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  // Web3Forms-Key aus dem CMS (öffentlich, kein Geheimnis). Leer = „Vorschau"-Modus.
  const accessKey = String(c.form_access_key || '').trim();
  const hasKey = accessKey.length > 0;
  const consentTxt = t(c, 'form_consent');

  // Nachrichten-Textfeld wächst mit dem Inhalt mit — bis zur max-height aus dem CSS
  // (300px), danach interner Scroll. 1:1-Port von wwGrowMsg (Live index.html).
  const msgRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    const ta = msgRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = parseInt(getComputedStyle(ta).maxHeight, 10) || 300;
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, [msg]);

  const clearForm = () => { setName(''); setEmail(''); setMsg(''); setConsent(false); };

  const onSend = async () => {
    if (!name.trim() || !email.trim() || !msg.trim()) {
      alert(lang === 'de' ? 'Bitte fülle alle Felder aus.' : 'Please fill in all fields.');
      return;
    }
    if (consentTxt && !consent) {
      alert(lang === 'de'
        ? 'Bitte stimme der Verarbeitung deiner Angaben zu, damit wir antworten können.'
        : 'Please agree to your details being processed so we can reply.');
      return;
    }
    // Honeypot gefüllt -> Bot: still „erfolgreich“ tun, aber nichts senden.
    if (honey.trim()) { setSent(true); clearForm(); return; }

    // Kein Key hinterlegt -> Vorschau-Modus (sendet nichts, wie bisher).
    if (!hasKey) { setSent(true); clearForm(); return; }

    setError('');
    setSending(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'Neue Nachricht über das Kontaktformular — Wide & Wild',
          from_name: 'Wide & Wild Website',
          name: name.trim(),
          email: email.trim(),
          message: msg.trim(),
          botcheck: '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json as any).success) {
        setSent(true);
        clearForm();
      } else {
        setError(t(c, 'form_error') || (lang === 'de'
          ? 'Senden fehlgeschlagen. Bitte später erneut versuchen oder direkt per E-Mail schreiben.'
          : 'Sending failed. Please try again later or email us directly.'));
      }
    } catch {
      setError(t(c, 'form_error') || (lang === 'de'
        ? 'Senden fehlgeschlagen. Bitte später erneut versuchen oder direkt per E-Mail schreiben.'
        : 'Sending failed. Please try again later or email us directly.'));
    } finally {
      setSending(false);
    }
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
              {error ? <div className="form-error show" role="alert">{error}</div> : null}
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
                <textarea ref={msgRef} value={msg} onChange={(e) => setMsg(e.target.value)} />
              </div>
              {/* Honeypot: für Menschen unsichtbar; füllt ein Bot es aus, wird nicht gesendet. */}
              <input
                type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={honey} onChange={(e) => setHoney(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
              />
              {consentTxt ? (
                <div className="form-consent">
                  <input id="ww-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>
                    <label htmlFor="ww-consent" data-tina-field={tf(c, 'form_consent')}>{consentTxt}</label>{' '}
                    <a href={lang === 'en' ? '/en/datenschutz' : '/datenschutz'} target="_blank" rel="noopener">
                      {lang === 'en' ? 'Privacy policy' : 'Datenschutzerklärung'}
                    </a>
                  </span>
                </div>
              ) : null}
              <button type="button" className="btn dark" data-tina-field={tf(c, 'form_send')} onClick={onSend} disabled={sending}>
                {sending ? (lang === 'de' ? 'Senden …' : 'Sending …') : t(c, 'form_send')}
              </button>
              {!hasKey ? <p className="form-note" data-tina-field={tf(c, 'form_note')}>{t(c, 'form_note')}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
