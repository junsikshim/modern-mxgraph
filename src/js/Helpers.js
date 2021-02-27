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

export const withConstructor = (o, constructor) => {
  o.constructor = constructor;
  o.name = constructor.name;

  return o;
};

export const noop = () => {};

export const isSet = (v) => v !== undefined && v !== null;

export const isUnset = (v) => !isSet(v);
