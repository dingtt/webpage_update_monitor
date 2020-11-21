class Resource {
  constructor() {
    this.id = "";
  }
  // static getUUID() {}
  // static getIdByUUID() {}
  // static getUUIDById() {}
}
// host  url  sleletor  filter
class ZhengCaiResource extends Resource {
  constructor({
    id,
    host,
    entry,
    entrySelector,
    name,
    headless,
    actions,
    detailSelector,
    keywords,
  }) {
    super();
    this.id = id;
    this.host = host;
    this.entry = entry;
    this.entrySelector = entrySelector;
    this.name = name;
    this.headless = headless;
    this.detailSelector = detailSelector;
    this.actions = actions;
    this.keywords = keywords ? keywords.replace("，", ",").split(",") : [];
  }
  getDetailUrl(route) {
    return this.host + route;
  }
  static getDetailUrlById(id) {}
}

module.exports = { ZhengCaiResource };
