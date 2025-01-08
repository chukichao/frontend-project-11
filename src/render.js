const renderFeeds = (state, i18nextInstance, feedsElement) => {
  const containerFeeds = document.createElement('div');
  containerFeeds.classList.add('card', 'border-0');

  feedsElement.append(containerFeeds);

  const headerContainerFeed = document.createElement('div');
  headerContainerFeed.classList.add('card-body');
  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = i18nextInstance.t('feeds');
  headerContainerFeed.append(header);

  const listFeed = document.createElement('ul');
  listFeed.classList.add('list-group', 'border-0', 'rounded-0');

  const feedItem = document.createElement('li');
  feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');

  const lastFeedIndex = state.feeds.length - 1;

  const headerFeed = document.createElement('h3');
  headerFeed.classList.add('h6', 'm-0');
  headerFeed.textContent = state.feeds[lastFeedIndex].title;

  const descriptionFeed = document.createElement('p');
  descriptionFeed.classList.add('m-0', 'small', 'text-black-50');
  descriptionFeed.textContent = state.feeds[lastFeedIndex].description;

  feedItem.append(headerFeed, descriptionFeed);
  listFeed.append(feedItem);

  containerFeeds.append(headerContainerFeed, listFeed);
};

const renderPosts = (state, i18nextInstance, postsElement) => {
  if (postsElement.children.length > 0) {
    const content = postsElement.querySelector('div');
    content.remove();
  }

  const containerPosts = document.createElement('div');
  containerPosts.classList.add('card', 'border-0');

  postsElement.append(containerPosts);

  const headerContainerPost = document.createElement('div');
  headerContainerPost.classList.add('card-body');
  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = i18nextInstance.t('posts');
  headerContainerPost.append(header);

  const listPost = document.createElement('ul');
  listPost.classList.add('list-group', 'border-0', 'rounded-0');

  const lastFeedIndex = state.feeds.length - 1;

  state.feeds[lastFeedIndex].posts.forEach((post) => {
    const postItem = document.createElement('li');
    postItem.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const refPost = document.createElement('a');
    refPost.setAttribute('href', 'http://example.com/test/1736206860');
    refPost.classList.add(post.viewed ? 'fw-normal' : 'fw-bold');
    refPost.setAttribute('data-id', `${post.id}`);
    refPost.setAttribute('target', '_blank');
    refPost.setAttribute('rel', 'noopener noreferrer');
    refPost.textContent = post.title;

    const buttonPost = document.createElement('button');
    buttonPost.setAttribute('type', 'button');
    buttonPost.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    buttonPost.setAttribute('data-id', `${post.id}`);
    buttonPost.setAttribute('data-bs-toggle', 'modal');
    buttonPost.setAttribute('data-bs-target', '#modal');
    buttonPost.textContent = i18nextInstance.t('preview');

    buttonPost.addEventListener('click', () => {
      const { posts } = state.feeds.find((feed) => feed.url === post.urlFeed);
      const currentPost = posts.find((postFeed) => postFeed.id === post.id);
      currentPost.viewed = true;

      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      const modalButton = document.querySelector('.modal-footer > a');

      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      modalButton.setAttribute('href', 'http://example.com/test/1736206860');

      renderPosts(state, i18nextInstance, postsElement);
    });

    postItem.append(refPost, buttonPost);
    listPost.append(postItem);
  });

  containerPosts.append(headerContainerPost, listPost);
};

export default (state, i18nextInstance, elements) => (path, value) => {
  const [formRss, inputUrl, buttonSubmit] = elements;

  const formFeedback = document.querySelector('.feedback');

  const feedsElement = document.querySelector('.feeds');
  const postsElement = document.querySelector('.posts');

  switch (value) {
    case 'loading posts': {
      buttonSubmit.setAttribute('disabled', '');
      break;
    }
    case 'clearing field': {
      formRss.reset();
      inputUrl.focus();
      buttonSubmit.removeAttribute('disabled');
      break;
    }
    case 'erroneous loaded': {
      inputUrl.classList.add('is-invalid');
      formFeedback.textContent = i18nextInstance.t(`errors.${state.error}`);
      formFeedback.classList.replace('text-success', 'text-danger');
      buttonSubmit.removeAttribute('disabled');
      break;
    }
    case 'successful loaded': {
      inputUrl.classList.remove('is-invalid');
      formFeedback.textContent = i18nextInstance.t('loading.success');
      formFeedback.classList.replace('text-danger', 'text-success');

      renderFeeds(state, i18nextInstance, feedsElement);
      renderPosts(state, i18nextInstance, postsElement);
      break;
    }
    case 'updating posts': {
      renderPosts(state, i18nextInstance, postsElement);
      break;
    }
    default:
      throw new Error(`Error: undefined state of the process '${state.processState}'`);
  }
};
