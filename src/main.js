import { AppRainier, AppRainierEvents } from '../../apprainier-web-plugin/src/index.js?v=2.0.3-web-carousel-readable-text';

const APPRAINIER_CONFIG_URL = new URL('../apprainier-config.json', import.meta.url).href;

const app = document.querySelector('#app');
const toastRoot = document.querySelector('#toast-root');

const featureScreens = [
  { id: 'surveys', title: 'Surveys', description: 'Launch every AppRainier survey trigger from web.' },
  { id: 'live-cards', title: 'Live Cards', description: 'Render AppRainier live cards as web-native DOM cards.' },
  { id: 'announcements', title: 'Announcements & Banners', description: 'Show announcement and banner prompts.' },
  { id: 'feature-flags', title: 'Feature Flags & Experiments', description: 'Evaluate flags, experiments, and audience variants.' },
  { id: 'message-center', title: 'Message Center', description: 'Open support chat and announcements.' },
];

const surveyTriggers = [
  ['Survey Thumbs up down Feedback', 'survey_thumbs_up_down_feedback'],
  ['Survey Star Rating Prompt', 'survey_star_rating_prompt'],
  ['Survey Post-support Feedback', 'post_support_feedback_survey'],
  ['Survey Multi-step Survey', 'multi_step_survey'],
  ['Survey Exit Survey', 'survey_exit_survey'],
  ['Survey Emoji-based Mood Tracker', 'emoji_based_mood_tracker_survey'],
  ['Survey Single-question Poll', 'single_question_poll_survey'],
  ['Multiple-choice Survey', 'multiple_choice_survey'],
  ['Product Market Fit Survey', 'product_market_fit_survey'],
  ['Customer Discovery Survey', 'customer_discovery_survey'],
  ['Survey Customer Satisfaction', 'survey_customer_satisfaction'],
  ['Survey Net Promoter Score', 'survey_net_promoter_score'],
  ['Survey Text Feedback Form', 'survey_text_feedback_form'],
];

const announcementTriggers = [
  ['Maintenance Alert Announcement', 'feature_announcement'],
  ['Announcement Carousel Announcements', 'carousel_announcement'],
  ['Announcement Feature Adoption Prompt', 'feature_adoption_announcement'],
  ['Announcement Mandatory Update Screen', 'mandatory_update_announcement'],
  ['Announcement Service Outage Banner', 'service_outage_announcement'],
  ['Announcement Maintenance Alert', 'maintenance_alert_announcement'],
  ['Announcement Version Update Banner', 'version_update_announcement'],
];

const liveCards = [
  ['ShopIT Home Hero Carousel', 'shopit_home_hero_carousel'],
  ['ShopIT Deal Tile', 'shopit_deal_tile'],
  ['Promotions Showcase Carousel', 'promotions_showcase_carousel'],
  ['Discount Product Live Card', 'live_card_discount_product'],
];

let sdkReady = false;
let sdkStatus = 'Initializing AppRainier...';
let sdkConfig = null;

function toast(title, message = '') {
  const node = document.createElement('div');
  node.className = 'toast';
  node.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  toastRoot.append(node);
  setTimeout(() => node.remove(), 3600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function button(label, className, onClick, disabled = false) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  node.disabled = disabled;
  node.addEventListener('click', onClick);
  return node;
}

function statusMarkup() {
  return `<span class="status-pill ${sdkReady ? 'ready' : ''}">${escapeHtml(sdkStatus)}</span>`;
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-card">
        <span class="eyebrow">AppRainier Web SDK</span>
        <h1>Browser engagement lab.</h1>
        <p>This test app imports the production-style web SDK directly and exercises surveys, live cards, announcements, feature flags, experiments, and message center.</p>
        <div class="actions" id="home-actions"></div>
      </div>
      <aside class="status-card hero-card">
        <strong>SDK State</strong>
        ${statusMarkup()}
        <p>Environment: <strong>${escapeHtml(sdkConfig?.environment || 'loading')}</strong></p>
        <p>Client app: <strong>${escapeHtml(sdkConfig?.workspace?.clientAppName || 'loading')}</strong></p>
        <p>Runtime: plain browser JavaScript</p>
      </aside>
    </section>
    <section class="grid" id="feature-grid"></section>
  `;

  document.querySelector('#home-actions').append(
    button('Register Test User', 'button accent', registerTestUser, !sdkReady),
    button('Send Sample Event', 'button secondary', sendSampleEvent, !sdkReady),
  );

  const grid = document.querySelector('#feature-grid');
  for (const screen of featureScreens) {
    const card = document.createElement('article');
    card.className = 'feature-card';
    card.innerHTML = `<h2>${escapeHtml(screen.title)}</h2><p>${escapeHtml(screen.description)}</p>`;
    card.append(button('Open', 'button', () => renderScreen(screen.id), !sdkReady));
    grid.append(card);
  }
}

function renderScreen(id) {
  const screen = featureScreens.find((item) => item.id === id);
  app.innerHTML = `
    <header class="screen-header">
      <div>
        <h1 class="screen-title">${escapeHtml(screen.title)}</h1>
        <p>${escapeHtml(screen.description)}</p>
        ${statusMarkup()}
      </div>
      <div class="actions"></div>
    </header>
    <section class="panel" id="screen-panel"></section>
  `;
  document.querySelector('.screen-header .actions').append(button('Back', 'button secondary', renderHome));
  if (id === 'surveys') renderTriggerList('screen-panel', surveyTriggers, async (triggerId) => {
    await AppRainier.refreshSurveys(true);
    const shown = await AppRainier.showSurvey(triggerId);
    if (!shown) toast('Survey not shown', `No eligible survey for ${triggerId}`);
  });
  if (id === 'announcements') renderTriggerList('screen-panel', announcementTriggers, async (triggerId) => {
    const shown = await AppRainier.showAnnouncement(triggerId);
    if (!shown) toast('Announcement not shown', `No eligible banner for ${triggerId}`);
  });
  if (id === 'live-cards') renderLiveCards();
  if (id === 'feature-flags') renderFeatureFlags();
  if (id === 'message-center') renderMessageCenter();
}

function renderTriggerList(panelId, rows, onClick) {
  const panel = document.querySelector(`#${panelId}`);
  panel.innerHTML = '<div class="list"></div>';
  const list = panel.querySelector('.list');
  for (const [label, triggerId] of rows) {
    list.append(button(`${label}  →`, 'row-button', async () => {
      try {
        await onClick(triggerId);
      } catch (error) {
        toast('Action failed', error.message || String(error));
      }
    }, !sdkReady));
  }
}

async function renderLiveCards() {
  const panel = document.querySelector('#screen-panel');
  panel.innerHTML = `
    <div class="actions" id="live-actions"></div>
    <div class="list" id="live-list"></div>
  `;
  document.querySelector('#live-actions').append(button('Refresh Live Cards', 'button accent', renderLiveCards, !sdkReady));
  const list = document.querySelector('#live-list');
  await AppRainier.refreshLiveCards(true);
  for (const [label, triggerId] of liveCards) {
    const section = document.createElement('article');
    section.className = 'feature-card';
    section.innerHTML = `<h2>${escapeHtml(label)}</h2><p><code>${escapeHtml(triggerId)}</code></p><div class="live-card-slot"></div>`;
    list.append(section);
    const slot = section.querySelector('.live-card-slot');
    try {
      await AppRainier.mountLiveCard(slot, triggerId, {
        onClick(payload) {
          toast('Live card clicked', payload.actionTarget || triggerId);
        },
      });
    } catch (error) {
      slot.textContent = error.message || String(error);
    }
  }
}

async function renderFeatureFlags() {
  const panel = document.querySelector('#screen-panel');
  panel.innerHTML = '<div class="actions" id="flag-actions"></div><div class="grid" id="flag-grid"></div>';
  document.querySelector('#flag-actions').append(button('Evaluate All', 'button accent', renderFeatureFlags, !sdkReady));
  await syncFeatureContext();
  await AppRainier.refreshFeatureFlags(true);
  const promo = await AppRainier.getFeatureFlag('promo_status', false);
  const audience = await AppRainier.getFeatureFlag('dashboard_audience_offer', 'No matching audience value');
  const variation = await AppRainier.getExperimentVariation('button_color_experiment');
  const config = await AppRainier.getExperimentConfig('button_color_experiment');
  const grid = document.querySelector('#flag-grid');
  grid.append(
    metricCard('Feature Flag: promo_status', String(promo)),
    metricCard('Audience Variant: dashboard_audience_offer', typeof audience === 'object' ? JSON.stringify(audience) : String(audience)),
    metricCard('Experiment: button_color_experiment', variation ? `${variation.name || variation.id}: ${JSON.stringify(variation.value)}` : 'No variation'),
    metricCard('Experiment Config', config ? JSON.stringify(config) : 'No config'),
  );
  await AppRainier.trackExperimentExposure('button_color_experiment', { source: 'web_test_app' });
}

function metricCard(title, value) {
  const card = document.createElement('article');
  card.className = 'feature-card';
  card.innerHTML = `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(value)}</p>`;
  return card;
}

async function renderMessageCenter() {
  const panel = document.querySelector('#screen-panel');
  await AppRainier.refreshMessageCenter();
  const count = await AppRainier.getUnreadMessageCount();
  panel.innerHTML = `
    <div class="metric">${count}</div>
    <p>${count === 1 ? 'unread support message' : 'unread support messages'}</p>
    <div class="actions" id="message-actions"></div>
  `;
  document.querySelector('#message-actions').append(
    button('Refresh', 'button secondary', renderMessageCenter, !sdkReady),
    button('Open Message Center', 'button accent', () => AppRainier.openMessageCenter({ initialTab: 'messages' }), !sdkReady),
  );
}

async function syncFeatureContext() {
  await Promise.all([
    AppRainier.setUserType('guest'),
    AppRainier.setUserProperty('country', 'Canada'),
    AppRainier.setUserProperty('platform', 'web'),
    AppRainier.setAppProperty('version', '1'),
    AppRainier.setAppProperty('version_name', '1'),
    AppRainier.setAppProperty('app_version', '1'),
    AppRainier.setDeviceProperty('platform', 'web'),
    AppRainier.setCustomProperty('web_feature_test', true),
  ]);
}

async function registerTestUser() {
  const timestamp = Date.now();
  const userId = `web_user_${timestamp}`;
  const email = `${userId}@example.com`;
  try {
    sdkStatus = `Registering ${userId}...`;
    renderHome();
    await AppRainier.setUserProfile({
      userId,
      userType: 'registered',
      userProperties: {
        name: 'Web Test User',
        email,
        country: 'Canada',
        plan: 'demo',
      },
      appProperties: {
        app_version: '1.0',
        build_type: 'debug',
        client: 'web-test-app',
      },
      deviceProperties: {
        platform: 'web',
        runtime: 'browser',
        test_device: true,
      },
      customProperties: {
        source: 'web_register_button',
        workspace: 'WebWorkspace',
      },
    });
    await AppRainier.identify(userId, { email, name: 'Web Test User' });
    await AppRainier.trackEvent('web_user_registered', { user_id: userId, email }, 'user');
    await AppRainier.trackEvent('web_test_app_sample_event', { button: 'register', timestamp });
    await AppRainier.flush();
    sdkStatus = `Registered ${userId}`;
    toast('Registered', `${userId} and sample events sent.`);
  } catch (error) {
    sdkStatus = error.message || 'Registration failed';
    toast('Registration failed', sdkStatus);
  }
  renderHome();
}

async function sendSampleEvent() {
  try {
    await AppRainier.trackEvent('web_test_button_clicked', {
      source: 'home_screen',
      timestamp: Date.now(),
    });
    await AppRainier.flush();
    toast('Event sent', 'web_test_button_clicked');
  } catch (error) {
    toast('Event failed', error.message || String(error));
  }
}

AppRainier.addSurveyCallback({
  onSurveySubmitted: (payload) => toast('Survey submitted', payload.surveyName || payload.eventName),
  onSurveyCancelled: (payload) => toast('Survey cancelled', payload.surveyName || payload.eventName),
  onSurveyDismissed: (payload) => toast('Survey dismissed', payload.surveyName || payload.eventName),
});

AppRainier.addAnnouncementCallback({
  onAnnouncementSubmitted: (payload) => toast('Announcement action', payload.deepLink || payload.action || payload.eventName),
  onAnnouncementDismissed: (payload) => toast('Announcement dismissed', payload.eventName),
});

AppRainier.addListener(AppRainierEvents.deepLink, (payload) => {
  toast('Deep link delivered', payload.deepLink || payload.actionTarget || 'No target');
});

async function boot() {
  renderHome();
  try {
    const configResponse = await fetch(APPRAINIER_CONFIG_URL, {
      credentials: 'same-origin',
      cache: 'no-cache',
    });
    if (!configResponse.ok) {
      throw new Error(`Unable to load AppRainier config: HTTP ${configResponse.status}`);
    }
    sdkConfig = await configResponse.json();
    const result = await AppRainier.initializeWithConfig(sdkConfig);
    await Promise.all([
      AppRainier.setDeviceProperty('platform', 'web'),
      AppRainier.setDeviceProperty('runtime', 'browser'),
      AppRainier.setUserProperty('country', 'Canada'),
      AppRainier.setUserProperty('platform', 'web'),
      AppRainier.setAppProperty('app_version', '1.0'),
      AppRainier.trackEvent('web_test_app_initialized', { result }),
    ]);
    sdkReady = true;
    sdkStatus = `AppRainier ready (${result})`;
  } catch (error) {
    sdkReady = false;
    sdkStatus = error.message || 'AppRainier initialization failed';
  }
  renderHome();
}

void boot();
