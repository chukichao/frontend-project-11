const getNormalizedTitle = (el) => el.innerHTML.slice(12, -6);
const getNormalizedDescription = (el) => el.innerHTML.slice(11, -5);

export default (contents) => {
  try {
    const parser = new DOMParser();
    const html = parser.parseFromString(contents, 'text/html');

    const feedId = Math.random() * 1e8;

    const posts = Array.from(html.querySelectorAll('item')).map((post) => ({
      title: getNormalizedTitle(post.querySelector('title')),
      description: getNormalizedDescription(post.querySelector('description')),
      id: Math.random() * 1e8,
      feedId,
    }));

    const feed = {
      title: getNormalizedTitle(html.querySelector('channel > title')),
      description: getNormalizedDescription(html.querySelector('channel > description')),
      id: feedId,
      posts,
    };

    return { ...feed };
  } catch (err) {
    const error = new Error('incorrect RSS');
    throw error;
  }
};
