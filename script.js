// ===== MSAL CONFIG =====
// ===== MSAL CONFIG =====
const msalConfig = {
  auth: {
    clientId: "a1c3f9fb-01d3-447e-a263-e4c754acc353",   // from App Registration
    authority: "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/B2B_1_signup_signin", 
    knownAuthorities: ["tshanesimmonsgmailauth.ciamlogin.com"], // trust only your CIAM tenant
    redirectUri: "https://tluckpatel.github.io/ProjectDelta/"   // GitHub Pages site
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginRequest = {
  scopes: ["openid", "profile", "email"]
};


// ====== NAV / STAGE TOGGLE ======
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
    signIn.hidden = true;
    signUp.hidden = false;
    leftText.textContent = 'Fast, friendly sign up with real-time password checks.';
  } else {
    signUp.hidden = true;
    signIn.hidden = false;
    leftText.textContent = 'Welcome back — sign in to continue.';
  }
}
toSignUp?.addEventListener('click', () => show('up'));
toSignIn?.addEventListener('click', () => show('in'));
toSignInTop?.addEventListener('click', () => show('in'));

// ====== HELPERS ======
const sanitize = (v) => (v || '').replace(/[<>\u0000-\u001F]/g, '').trim();
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isValidSiPassword = (v) => (v || '').length >= 8;
const isValidName = v => /^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v);
const isValidCompany = v => /^[A-Za-z0-9][A-Za-z0-9 .&'-]{1,99}$/.test(v);
const toDigits = v => (v || '').replace(/\D/g, '');
const isValidPhone = v => /^\d{7,15}$/.test(v);

// ====== SIGN-IN ======
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

  siEmailErr.textContent = (!emailOK && e) ? 'Please enter a valid email address.' : '';
  siPassErr.textContent = (!passOK && p) ? 'Password must be at least 8 characters.' : '';

  const ready = emailOK && passOK;
  signInBtn.disabled = !ready;
  signInBtn.classList.toggle('is-disabled', !ready);
}

siEmail?.addEventListener('input', validateSignIn);
siPass?.addEventListener('input', validateSignIn);

signIn?.addEventListener('submit', (e) => {
  e.preventDefault();
  validateSignIn();
  if (signInBtn.disabled) return;

  msalInstance.loginPopup(loginRequest)
    .then(result => {
      const account = result.account;
      leftText.textContent = `Welcome ${account.username}`;
    })
    .catch(err => console.error(err));
});

// ====== SIGN-UP ======
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
  const v1 = pw1?.value || '';
  const v2 = pw2?.value || '';

  Object.entries({
    length: checks.length(v1),
    upper: checks.upper(v1),
    lower: checks.lower(v1),
    digit: checks.digit(v1),
    special: checks.special(v1)
  }).forEach(([k, v]) => setRule(k, v));

  const matches = checks.match(v1, v2);
  pw2Error.textContent = (v2 && !matches) ? 'Password does not match' : '';

  const allOK = matches && Object.values(checks).slice(0, 5).every(fn => fn(v1));
  signUpBtn.disabled = !allOK;
  signUpBtn.classList.toggle('is-disabled', !allOK);
}

pw1?.addEventListener('input', validateSignUp);
pw2?.addEventListener('input', validateSignUp);

signUp?.addEventListener('submit', (e) => {
  e.preventDefault();
  validateSignUp();
  if (signUpBtn.disabled) return;

  msalInstance.loginPopup(loginRequest)
    .then(result => {
      const account = result.account;
      leftText.textContent = `Welcome ${account.username}`;
    })
    .catch(err => console.error(err));
});

