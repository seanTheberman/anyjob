export type MobileContentType = "text" | "textarea" | "url";

export type MobileContentDefinition = {
  key: string;
  section: string;
  label: string;
  defaultValue: string;
  description: string;
  type: MobileContentType;
};

const entry = (
  key: string,
  section: string,
  label: string,
  defaultValue: string,
  description: string,
  type: MobileContentType = "text",
): MobileContentDefinition => ({ key, section, label, defaultValue, description, type });

export const MOBILE_CONTENT_CATALOG: MobileContentDefinition[] = [
  entry("home.hero.kicker", "Home banner", "Banner eyebrow", "ANYJOB", "Short text above the main banner heading."),
  entry("home.hero.title", "Home banner", "Banner title", "Get things done, your way.", "Primary buyer home banner heading."),
  entry("home.hero.body", "Home banner", "Banner subtitle", "Trusted help for everyday tasks.", "Supporting buyer home banner copy.", "textarea"),
  entry("home.hero.search", "Home banner", "Search prompt", "What do you need help with?", "Placeholder in the banner job search control."),
  entry("home.hero.image_url", "Home banner", "Banner image URL", "", "Optional HTTPS image URL. Leave blank to use the bundled image.", "url"),
  entry("home.services.title", "Home sections", "Services heading", "Popular services", "Heading above service categories."),
  entry("home.nearby.title", "Home sections", "Nearby heading", "Popular near you", "Heading above nearby service cards."),
  entry("home.activity.title", "Home sections", "Activity heading", "Your activity", "Heading above the latest request."),
  entry("home.providers.title", "Home sections", "Providers heading", "Recommended taskers", "Heading above recommended providers."),
  entry("home.trust.title", "Home sections", "Trust heading", "Book with confidence", "Heading above trust information."),
  entry("home.cta.title", "Home call to action", "Call-to-action title", "Ready to get it sorted?", "Bottom home call-to-action heading."),
  entry("home.cta.body", "Home call to action", "Call-to-action subtitle", "Post once and compare local quotes.", "Bottom home call-to-action description.", "textarea"),
  ...Array.from({ length: 9 }, (_, index) => {
    const defaults = [
      ["Choose a service", "Start with the type of help you need."],
      ["Specify your need", "Choose the closest match so providers can quote accurately."],
      ["Service and urgency", "Tell us how often and how soon you need help."],
      ["Describe the job", "Give providers enough detail to prepare a useful quote."],
      ["Choose a schedule", "Set your preferred date and time."],
      ["Add the location", "Your exact address stays private until booking."],
      ["Define the scope", "Set the expected effort, budget, and supplies."],
      ["Add work photos", "Photos are optional, but they help providers quote."],
      ["Review and submit", "Check the request before sending it for approval."],
    ][index];
    const step = index + 1;
    return [
      entry(`request.step.${step}.title`, "Request steps", `Step ${step} title`, defaults[0], "Request wizard step heading."),
      entry(`request.step.${step}.subtitle`, "Request steps", `Step ${step} subtitle`, defaults[1], "Request wizard step supporting copy.", "textarea"),
    ];
  }).flat(),
  entry("request.service_type.title", "Request options", "Service type heading", "Service type", "Heading above service frequency choices."),
  ...[
    ["one_time", "One time", "One-off service"],
    ["recurring", "Regular", "Recurring service (weekly, monthly...)"],
    ["emergency", "Emergency", "Immediate need"],
    ["project", "Project", "Multi-day project"],
  ].flatMap(([key, label, description]) => [
    entry(`request.service_type.${key}.label`, "Request options", `${label} label`, label, "Service type choice label."),
    entry(`request.service_type.${key}.description`, "Request options", `${label} description`, description, "Service type choice supporting copy."),
  ]),
  entry("request.urgency.title", "Request options", "Urgency heading", "How soon do you need it?", "Heading above urgency choices."),
  ...[
    ["asap", "As soon as possible"],
    ["this_week", "This week"],
    ["this_month", "This month"],
    ["flexible", "Flexible"],
  ].map(([key, label]) => entry(`request.urgency.${key}.label`, "Request options", `${label} label`, label, "Urgency choice label.")),
  entry("request.schedule.date_label", "Request schedule", "Date field label", "Preferred date", "Date picker label."),
  entry("request.schedule.start_label", "Request schedule", "Start field label", "Start time", "Start time picker label."),
  entry("request.schedule.end_label", "Request schedule", "End field label", "End time", "End time picker label."),
  entry("request.schedule.flexible_title", "Request schedule", "Flexible timing title", "My timing is flexible", "Flexible timing toggle title."),
  entry("request.schedule.flexible_body", "Request schedule", "Flexible timing description", "Providers can suggest a nearby time.", "Flexible timing toggle supporting copy.", "textarea"),
  entry("request.action.back", "Request actions", "Back button", "Back", "Request wizard secondary action."),
  entry("request.action.continue", "Request actions", "Continue button", "Continue", "Request wizard primary action."),
  entry("request.action.submit", "Request actions", "Submit button", "Submit for approval", "Signed-in request submit action."),
  entry("explore.buyer.title", "Explore", "Buyer title", "Discover local pros", "Buyer explore screen title."),
  entry("explore.buyer.subtitle", "Explore", "Buyer subtitle", "Portfolio work, verified reviews and clear pricing.", "Buyer explore screen supporting copy.", "textarea"),
  entry("explore.provider.title", "Explore", "Provider title", "Find work", "Provider explore screen title."),
  entry("explore.provider.subtitle", "Explore", "Provider subtitle", "Approved jobs with approximate buyer areas.", "Provider explore screen supporting copy.", "textarea"),
  entry("account.title", "Account", "Account title", "Account", "Account screen title."),
  entry("account.subtitle", "Account", "Account subtitle", "Your identity, preferences and marketplace settings.", "Signed-in account screen supporting copy.", "textarea"),
  entry("auth.sign_in.title", "Authentication", "Sign-in title", "Welcome back", "Sign-in screen heading."),
  entry("auth.forgot.title", "Authentication", "Forgot password title", "Reset password", "Forgot password screen heading."),
  entry("auth.forgot.subtitle", "Authentication", "Forgot password subtitle", "We will email a secure reset link to your account.", "Forgot password screen supporting copy.", "textarea"),
];

export const MOBILE_CONTENT_KEYS = new Set(MOBILE_CONTENT_CATALOG.map((item) => item.key));
