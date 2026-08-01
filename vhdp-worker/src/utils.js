export function makeUrlsAbsolute(obj, origin) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    if (obj.startsWith("/uploads/")) {
      return `${origin}${obj}`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => makeUrlsAbsolute(item, origin));
  }
  if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = makeUrlsAbsolute(obj[key], origin);
    }
    return newObj;
  }
  return obj;
}
