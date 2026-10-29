// Tools the model may call. Data comes from a provider so the same tools run on demo data
// now and on the DealMatch backend later.
export const toolSchemas = [
  { type: 'function', function: { name: 'search_listings', description: 'Search verified home listings.',
    parameters: { type: 'object', properties: {
      city: { type: 'string' }, area: { type: 'string' }, bedrooms: { type: 'integer' },
      max_price_ngn_year: { type: 'integer' } } } } },
  { type: 'function', function: { name: 'search_providers', description: 'Search service providers (artisans, tutors, cleaners and other people). `service` is one specific trade such as electrician, plumber, cleaner or tutor. For broad words like artisan, handyman or someone, leave `service` out and search by area.',
    parameters: { type: 'object', properties: {
      service: { type: 'string' }, city: { type: 'string' }, area: { type: 'string' },
      max_price_ngn: { type: 'integer' } } } } },
  { type: 'function', function: { name: 'get_listing', description: 'Get one listing by id.',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
];

// Private fields never leave the tool layer; the model cannot be talked into revealing them.
const PUBLIC_FIELDS = ['id', 'title', 'city', 'area', 'bedrooms', 'price_ngn_year', 'trust', 'description'];
const pick = (l) => Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, l[k]]));

const PROVIDER_FIELDS = ['id', 'name', 'service', 'city', 'area', 'starting_price_ngn', 'trust', 'description'];

export function makeTools(listings, ledger, providers = []) {
  const recordProvider = (p) => {
    const evidence = {};
    for (const f of ['service', 'starting_price_ngn', 'area']) {
      evidence[f] = ledger.add({ listingId: p.id, field: f, value: p[f], tier: p.trust, tool: 'providers' });
    }
    return { ...Object.fromEntries(PROVIDER_FIELDS.map((k) => [k, p[k]])), evidence };
  };
  const record = (l) => {
    const evidence = {};
    for (const f of ['price_ngn_year', 'bedrooms', 'area']) {
      evidence[f] = ledger.add({ listingId: l.id, field: f, value: l[f], tier: l.trust, tool: 'listings' });
    }
    return { ...pick(l), evidence };
  };
  return {
    search_providers: ({ service, city, area, max_price_ngn } = {}) =>
      providers
        .filter((p) => (!service || p.service.toLowerCase().includes(service.toLowerCase()))
          && (!city || p.city.toLowerCase() === city.toLowerCase())
          && (!area || p.area.toLowerCase() === area.toLowerCase())
          && (max_price_ngn == null || p.starting_price_ngn <= max_price_ngn))
        .slice(0, 5).map(recordProvider),
    search_listings: ({ city, area, bedrooms, max_price_ngn_year } = {}) =>
      listings
        .filter((l) => (!city || l.city.toLowerCase() === city.toLowerCase())
          && (!area || l.area.toLowerCase() === area.toLowerCase())
          && (bedrooms == null || l.bedrooms === bedrooms)
          && (max_price_ngn_year == null || l.price_ngn_year <= max_price_ngn_year))
        .slice(0, 5).map(record),
    get_listing: ({ id }) => {
      const l = listings.find((x) => x.id === id);
      return l ? record(l) : { error: 'not_found' };
    },
  };
}
