const getDateByTitlePost = (title) => new Date(title.split(' ').at(-1)).getTime();

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');

  if (doc.querySelector('parsererror')) {
    throw Error('RSS Error');
  }

  const feed = {
    title: doc.querySelector('channel > title').textContent,
    description: doc.querySelector('channel > description').textContent,
  };

  const posts = Array.from(doc.querySelectorAll('item')).map((post) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;
    const createAt = getDateByTitlePost(title);

    return {
      title,
      description,
      createAt,
    };
  });

  return { feed, posts };
};
