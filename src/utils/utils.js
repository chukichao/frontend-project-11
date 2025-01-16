export const parceXML = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');

  if (doc.querySelector('parsererror')) {
    throw Error('Parsing Error');
  }

  return doc;
};

export const getProxyURL = (inputValueUrl) => {
  const proxyURL = new URL('https://allorigins.hexlet.app/get');
  proxyURL.searchParams.append('disableCache', 'true');
  proxyURL.searchParams.append('url', inputValueUrl);

  return proxyURL;
};
