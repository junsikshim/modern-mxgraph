export const addProp = (initialValue) => {
  let value = initialValue;

  return [
    () => value,
    (v) => {
      value = v;
      return v;
    }
  ];
};

export const makeComponent = (constructor) => {
  let overrides = {};

  // need to access overrides inside the constructor
  constructor.getOverrides = () => overrides;
  constructor.setOverrides = (o) => (overrides = o);

  // wrap the constructor
  const f = (...args) => {
    const o = constructor(...args);

    for (const k in overrides) {
      // prefix the old function with an underscore
      if (isSet(o[k])) o['_' + k] = o[k];

      o[k] = overrides[k];
    }

    // needed for constructor comparison
    o.constructor = f;
    o.name = constructor.name;

    return o;
  };

  // access overrides from outside
  f.getOverrides = constructor.getOverrides;
  f.setOverrides = constructor.setOverrides;

  // transfer the static ones
  for (const k of Object.keys(constructor)) {
    f[k] = constructor[k];
  }

  return f;
};

export const createWithOverrides = (overrides = {}) => (Component) => (
  ...args
) => {
  const orig = Component.getOverrides();
  Component.setOverrides(overrides);
  const o = Component(...args);
  Component.setOverrides(orig);

  return o;
};

export const noop = () => {};

export const isSet = (v) => v !== undefined && v !== null;

export const isUnset = (v) => !isSet(v);
