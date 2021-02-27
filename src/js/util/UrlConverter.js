/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Copyright (c) 2021, Junsik Shim
 */

import { addProp, isSet, isUnset } from './Utils';

/**
 *
 * Class: UrlConverter
 *
 * Converts relative and absolute URLs to absolute URLs with protocol and domain.
 */
const UrlConverter = () => {
  /**
   * Variable: enabled
   *
   * Specifies if the converter is enabled. Default is true.
   */
  const [isEnabled, setEnabled] = addProp(true);

  /**
   * Variable: baseUrl
   *
   * Specifies the base URL to be used as a prefix for relative URLs.
   */
  const [getBaseUrl, setBaseUrl] = addProp();

  /**
   * Variable: baseDomain
   *
   * Specifies the base domain to be used as a prefix for absolute URLs.
   */
  const [getBaseDomain, setBaseDomain] = addProp();

  /**
   * Function: updateBaseUrl
   *
   * Private helper function to update the base URL.
   */
  const updateBaseUrl = () => {
    setBaseDomain(location.protocol + '//' + location.host);
    setBaseUrl(getBaseDomain() + location.pathname);
    const tmp = getBaseUrl().lastIndexOf('/');

    // Strips filename etc
    if (tmp > 0) {
      setBaseUrl(getBaseUrl().substring(0, tmp + 1));
    }
  };

  const isRelativeUrl = (url) =>
    isSet(url) &&
    url.substring(0, 2) !== '//' &&
    url.substring(0, 7) !== 'http://' &&
    url.substring(0, 8) !== 'https://' &&
    url.substring(0, 10) !== 'data:image' &&
    url.substring(0, 7) !== 'file://';

  const convert = (url) => {
    if (isEnabled() && isRelativeUrl(url)) {
      if (isUnset(getBaseUrl())) updateBaseUrl();

      const u =
        url.charAt(0) === '/' ? getBaseDomain() + url : getBaseUrl() + url;

      return u;
    }
  };

  const me = {
    updateBaseUrl,

    /**
     * Function: isEnabled
     *
     * Returns <enabled>.
     */
    isEnabled,

    /**
     * Function: setEnabled
     *
     * Sets <enabled>.
     */
    setEnabled,

    /**
     * Function: getBaseUrl
     *
     * Returns <baseUrl>.
     */
    getBaseUrl,

    /**
     * Function: setBaseUrl
     *
     * Sets <baseUrl>.
     */
    setBaseUrl,

    /**
     * Function: getBaseDomain
     *
     * Returns <baseDomain>.
     */
    getBaseDomain,

    /**
     * Function: setBaseDomain
     *
     * Sets <baseDomain>.
     */
    setBaseDomain,

    /**
     * Function: isRelativeUrl
     *
     * Returns true if the given URL is relative.
     */
    isRelativeUrl,

    /**
     * Function: convert
     *
     * Converts the given URL to an absolute URL with protol and domain.
     * Relative URLs are first converted to absolute URLs.
     */
    convert
  };

  return me;
};

export default UrlConverter;
