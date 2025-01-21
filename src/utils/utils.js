export const parceXML = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');

  if (doc.querySelector('parsererror')) {
    throw Error('Parsing Error');
  }

  const channel = {
    title: doc.querySelector('channel > title').textContent,
    description: doc.querySelector('channel > description').textContent,
  };

  const items = Array.from(doc.querySelectorAll('item')).map((post) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;

    return {
      title,
      description,
    };
  });

  return { channel, items };
};

export const getProxyURL = (inputValueUrl) => {
  const proxyURL = new URL('https://allorigins.hexlet.app/get');
  proxyURL.searchParams.append('disableCache', 'true');
  proxyURL.searchParams.append('url', inputValueUrl);

  return proxyURL;
};
