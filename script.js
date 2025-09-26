/*******************************
 * MSAL CONFIG — CIAM + B2B flow
 *******************************/
// ===== MSAL CONFIG (authorityMetadata inside auth) =====
const msalConfig = {
  auth: {
    clientId: "a1c3f9fb-01d3-447e-a263-e4c754acc353",
    authority: "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/B2B_1_signup_signin",
    knownAuthorities: ["tshanesimmonsgmailauth.ciamlogin.com"],
    redirectUri: "https://agreeable-flower-00cd2da0f.1.azurestaticapps.net",

    // IMPORTANT: no ?p=... on any of these endpoints
    authorityMetadata: JSON.stringify({
      "issuer": "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/B2B_1_signup_signin/v2.0/",
      "authorization_endpoint": "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/oauth2/v2.0/authorize",
      "token_endpoint":         "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/oauth2/v2.0/token",
      "end_session_endpoint":   "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/oauth2/v2.0/logout",
      "jwks_uri":               "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/discovery/v2.0/keys"
    })
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);


// Always send the user-flow (policy) as p=…
// Scopes are just OIDC for now.
const loginRequest = {
  scopes: ["openid", "profile", "email"],
  extraQueryParameters: { p: "B2B_1_signup_signin" }
};

/****************************************
 * NAV / STAGE TOGGLE (keep your UI intact)
 ****************************************/
const body = document.body;
const startBtn = document.getElementById('startBtn');
const homeBtn = document.getElementById('homeBtn');

const signIn = document.getElementById('signIn');
const signUp = document.getElementById('signUp');
const toSignUp = document.getElementById('toSignUp');
const toSignIn = document.getElementById('toSignIn');
const toSignInTop = document.getElementById('toSignInTop');
const leftText = document.getElementById('leftText');

startBtn?.addEventListener('click', () => { body.classList.add('auth'); show('in'); });
homeBtn?.addEventListener('click', () => { body.classList.remove('auth'); show('in'); window.scrollTo({ top: 0, behavior: 'smooth' }); });

function show(which) {
  if (which === 'up') {
    if (signIn) signIn.hidden = true;
    if (signUp) signUp.hidden = false;
    if (leftText) leftText.textContent = 'Fast, friendly sign up with real-time password checks.';
  } else {
    if (signUp) signUp.hidden = true;
    if (signIn) signIn.hidden = false;
    if (leftText) leftText.textContent = 'Welcome back — sign in to continue.';
  }
}
toSignUp?.addEventListener('click', () => show('up'));
toSignIn?.addEventListener('click', () => show('in'));
toSignInTop?.addEventListener('click', () => show('in'));

/*****************
 * SHARED HELPERS
 *****************/
const sanitize = (v) => (v || '').replace(/[<>\u0000-\u001F]/g, '').trim();
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isValidSiPassword = (v) => (v || '').length >= 8;
const isValidName = v => /^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v);
const isValidCompany = v => /^[A-Za-z0-9][A-Za-z0-9 .&'-]{1,99}$/.test(v);
const toDigits = v => (v || '').replace(/\D/g, '');
const isValidPhone = v => /^\d{7,15}$/.test(v);

/************
 * SIGN-IN UI
 ************/
const siEmail = document.getElementById('siEmail');
const siPass = document.getElementById('siPass');
const siEmailErr = document.getElementById('siEmailErr');
const siPassErr = document.getElementById('siPassErr');
const signInBtn = document.getElementById('signInBtn');

function validateSignIn() {
  const e = sanitize(siEmail?.value);
  const p = sanitize(siPass?.value);

  const emailOK = isValidEmail(e);
  const passOK = isValidSiPassword(p);

  if (siEmailErr) siEmailErr.textContent = (!emailOK && e) ? 'Please enter a valid email address.' : '';
  if (siPassErr)  siPassErr.textContent  = (!passOK && p) ? 'Password must be at least 8 characters.' : '';

  const ready = emailOK && passOK;
  if (signInBtn) {
    signInBtn.disabled = !ready;
    signInBtn.classList.toggle('is-disabled', !ready);
  }
}

siEmail?.addEventListener('input', validateSignIn);
siPass?.addEventListener('input', validateSignIn);

signIn?.addEventListener('submit', (e) => {
  e.preventDefault();
  validateSignIn();
  if (signInBtn?.disabled) return;

  // Must be triggered directly by user action to avoid popup blocking
  msalInstance.loginPopup(loginRequest)
    .then(result => {
      const account = result.account;
      if (leftText) leftText.textContent = `Welcome ${account?.username || 'back'}!`;
    })
    .catch(err => console.error(err));
});

/*************
 * SIGN-UP UI
 *************/
const pw1 = document.getElementById('pw1');
const pw2 = document.getElementById('pw2');
const pw2Error = document.getElementById('pw2Error');
const checklist = document.getElementById('pwChecklist');
const signUpBtn = document.getElementById('signUpBtn');

const fn = document.getElementById('fn');
const ln = document.getElementById('ln');
const company = document.getElementById('company');
const suEmail = document.getElementById('suEmail');
const phone = document.getElementById('phone');

const checks = {
  length: v => v.length >= 8,
  upper: v => /[A-Z]/.test(v),
  lower: v => /[a-z]/.test(v),
  digit: v => /\d/.test(v),
  special: v => /[^\w\s]/.test(v),
  match: (a, b) => a && a === b
};

function setRule(rule, ok) {
  const el = checklist?.querySelector(`.rule[data-rule="${rule}"] .icon`);
  if (el) {
    el.textContent = ok ? '✓' : '✗';
    el.classList.toggle('good', ok);
    el.classList.toggle('bad', !ok);
  }
}

function validateSignUp() {
  const first = sanitize(fn?.value);
  const last = sanitize(ln?.value);
  const comp = sanitize(company?.value);
  const em = sanitize(suEmail?.value);
  const ph = toDigits(phone?.value || '');

  // (Optional) field validations (visuals) — you already had rules; keep UI as-is

  const v1 = pw1?.value || '';
  const v2 = pw2?.value || '';

  const rules = {
    length: checks.length(v1),
    upper: checks.upper(v1),
    lower: checks.lower(v1),
    digit: checks.digit(v1),
    special: checks.special(v1)
  };
  Object.entries(rules).forEach(([k, v]) => setRule(k, v));

  const matches = checks.match(v1, v2);
  if (pw2Error) pw2Error.textContent = (v2 && !matches) ? 'Password does not match' : '';

  const allPwRules = Object.values(rules).every(Boolean);
  const allOK = allPwRules && matches;

  if (signUpBtn) {
    signUpBtn.disabled = !allOK;
    signUpBtn.classList.toggle('is-disabled', !allOK);
  }
}

pw1?.addEventListener('input', validateSignUp);
pw2?.addEventListener('input', validateSignUp);

signUp?.addEventListener('submit', (e) => {
  e.preventDefault();
  validateSignUp();
  if (signUpBtn?.disabled) return;

  // Same flow; CIAM page will branch to sign-up if user is new
  msalInstance.loginPopup(loginRequest)
    .then(result => {
      const account = result.account;
      if (leftText) leftText.textContent = `Welcome ${account?.username || 'back'}!`;
    })
    .catch(err => console.error(err));
});

/********************
 * INITIAL UI STATES
 ********************/
validateSignIn();
validateSignUp();

