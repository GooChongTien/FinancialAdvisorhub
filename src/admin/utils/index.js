const pageRoutes = {
  Home: "/",
  Customer: "/customers",
  CustomerDetail: "/customers/detail",
  NewBusiness: "/new-business",
  Product: "/product",
  Analytics: "/analytics",
  ToDo: "/todo",
  Broadcast: "/broadcast",
  BroadcastDetail: "/broadcast/detail",
  ProfileSettings: "/profile-settings",
  Login: "/login",
  Register: "/register",
  ProposalDetail: "/proposals/detail",
  QuoteSummary: "/quote-summary",
  PolicyDetail: "/policies/detail",
  ChatMira: "/chat",
  ChatHistory: "/chats",
  MiraQuickstart: "/mira-quickstart",
  MiraOps: "/mira/ops",
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
