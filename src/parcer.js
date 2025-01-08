const getNormalizedTitle = (el) => el.innerHTML.slice(12, -6);
const getNormalizedDescription = (el) => el.innerHTML.slice(11, -5);

const getNormalizedDate = (el) => new Date(el.innerHTML.slice(12, -6).split(' ').at(-1)).getTime();

export default (contents, url) => {
  try {
    const parser = new DOMParser();
    const html = parser.parseFromString(contents, 'text/html');

    const posts = Array.from(html.querySelectorAll('item')).map((post) => ({
      title: getNormalizedTitle(post.querySelector('title')),
      description: getNormalizedDescription(post.querySelector('description')),
      date: getNormalizedDate(post.querySelector('title')),
      id: Math.random() * 1e8,
      urlFeed: url,
      viewed: false,
    }));

    const feed = {
      title: getNormalizedTitle(html.querySelector('channel > title')),
      description: getNormalizedDescription(html.querySelector('channel > description')),
      id: Math.random() * 1e8,
      url,
      posts,
    };

    return { ...feed };
  } catch (err) {
    const error = new Error('RSS Error');
    throw error;
  }
};
