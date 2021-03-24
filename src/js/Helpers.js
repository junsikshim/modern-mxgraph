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
  const f = (...args) => {
    const o = constructor(...args);

    // needed for constructor comparison
    o.constructor = f;
    o.name = constructor.name;

    o.resolve = (name) => {
      let cur = o;

      while (isSet(cur) && isSet(cur.child) && cur !== cur.child) {
        cur = cur.child;
      }

      while (isSet(cur) && cur !== cur.parent) {
        if (isSet(cur.constructor.overrides[name])) {
          return cur.constructor.overrides[name];
        }
        if (cur.hasOwnProperty(name)) return cur[name];

        cur = cur.parent;
      }

      throw new Error(`Could not resolve ${name}!`);
    };

    return o;
  };

  Object.defineProperty(f, 'overrides', { value: {}, enumerable: false })

  f.getOverrides = () => f.overrides;
  f.setOverride = (name, func) => f.overrides[name] = func;

  return f;
};

export const extendFrom = (parent) => (o) => {
  if (parent === o) return;

  Object.setPrototypeOf(o, parent);
  o.parent = parent;
  parent.child = o;
};

export const noop = () => {};

export const isSet = (v) => v !== undefined && v !== null;

export const isUnset = (v) => !isSet(v);
