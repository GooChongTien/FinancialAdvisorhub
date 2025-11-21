const pageRoutes = {
  Home: "/advisor/home",
  Customer: "/advisor/customers",
  CustomerDetail: "/advisor/customers/detail",
  NewBusiness: "/advisor/new-business",
  Product: "/advisor/product",
  Analytics: "/advisor/analytics",
  ToDo: "/advisor/todo",
  Broadcast: "/advisor/broadcast",
  BroadcastDetail: "/advisor/broadcast/detail",
  ProfileSettings: "/advisor/profile-settings",
  Login: "/login",
  Register: "/register",
  ProposalDetail: "/advisor/proposals/detail",
  QuoteSummary: "/advisor/quote-summary",
  PolicyDetail: "/advisor/policies/detail",
  ChatMira: "/advisor/chat",
  ChatHistory: "/advisor/chats",
  MiraQuickstart: "/quickstart",
  MiraOps: "/advisor/mira/ops",
};

export function createPageUrl(descriptor) {
  if (!descriptor) return "/";
  if (descriptor.startsWith("/")) return descriptor;

  const [pageName, queryString] = descriptor.split("?");
  const basePath = pageRoutes[pageName] ?? `/${pageName.toLowerCase()}`;

  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getRouteByPath(path) {
  return Object.entries(pageRoutes).find(([, routePath]) => routePath === path);
}

export function getPageNameFromPath(pathname) {
  const exactMatch = getRouteByPath(pathname);
  if (exactMatch) {
    return exactMatch[0];
  }

  const entry = Object.entries(pageRoutes).find(([, routePath]) =>
    pathname.startsWith(routePath),
  );

  return entry ? entry[0] : "Home";
}

export function listRoutes() {
  return Object.entries(pageRoutes).map(([name, path]) => ({ name, path }));
}

export { pageRoutes };
