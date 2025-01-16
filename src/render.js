import onChange from 'on-change';

const renderFeeds = (state, i18nextInstance, feedsElement) => {
  if (feedsElement.children.length > 0) {
    const content = feedsElement.querySelector('div');
    content.remove();
  }

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

  state.feeds.forEach((feed) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');

    const headerFeed = document.createElement('h3');
    headerFeed.classList.add('h6', 'm-0');
    headerFeed.textContent = feed.title;

    const descriptionFeed = document.createElement('p');
    descriptionFeed.classList.add('m-0', 'small', 'text-black-50');
    descriptionFeed.textContent = feed.description;

    feedItem.append(headerFeed, descriptionFeed);
    listFeed.append(feedItem);
  });

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

  state.posts.forEach((post) => {
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
    refPost.classList.add(state.uiState.viewedPosts.has(post.id) ? 'fw-normal' : 'fw-bold');
    refPost.setAttribute('data-id', `${post.id}`);
    refPost.setAttribute('target', '_blank');
    refPost.setAttribute('rel', 'noopener noreferrer');
    refPost.textContent = post.title;

    const watchedState = onChange(state, () => {
      refPost.classList.remove('fw-normal', 'fw-bold');
      refPost.classList.add(state.uiState.viewedPosts.has(post.id) ? 'fw-normal' : 'fw-bold');
    });

    refPost.addEventListener('click', () => {
      watchedState.uiState.viewedPosts.add(post.id);
    });

    const buttonPost = document.createElement('button');
    buttonPost.setAttribute('type', 'button');
    buttonPost.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    buttonPost.setAttribute('data-id', `${post.id}`);
    buttonPost.setAttribute('data-bs-toggle', 'modal');
    buttonPost.setAttribute('data-bs-target', '#modal');
    buttonPost.textContent = i18nextInstance.t('preview');

    buttonPost.addEventListener('click', () => {
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      const modalButton = document.querySelector('.modal-footer > a');

      modalTitle.textContent = post.title;
      modalBody.textContent = post.description;
      modalButton.setAttribute('href', 'http://example.com/test/1736206860');

      watchedState.uiState.viewedPosts.add(post.id);
    });

    postItem.append(refPost, buttonPost);
    listPost.append(postItem);
  });

  containerPosts.append(headerContainerPost, listPost);
};

/* eslint-disable no-param-reassign */
const render = (state, i18nextInstance, elementPage) => (path, value) => {
  if (path === 'posts') renderPosts(state, i18nextInstance, elementPage.postsElement);
  if (path === 'feeds') renderFeeds(state, i18nextInstance, elementPage.feedsElement);

  if (path === 'form.isValid') {
    elementPage.inputUrl.classList.remove('is-invalid');

    if (value === false) {
      elementPage.inputUrl.classList.add('is-invalid');
    }
  }

  if (path === 'loadingProcess.status') {
    switch (value) {
      case 'loading': {
        elementPage.buttonAdd.setAttribute('disabled', '');
        elementPage.inputUrl.setAttribute('disabled', '');

        elementPage.formFeedback.textContent = '';
        break;
      }
      case 'failed': {
        elementPage.formFeedback.textContent = i18nextInstance.t(
          `errors.${state.form.error || state.loadingProcess.error}`,
        );

        elementPage.formFeedback.classList.replace('text-success', 'text-danger');

        elementPage.inputUrl.removeAttribute('disabled');
        elementPage.buttonAdd.removeAttribute('disabled');
        elementPage.inputUrl.focus();
        break;
      }
      case 'success': {
        elementPage.formFeedback.textContent = i18nextInstance.t('loading.success');

        elementPage.formFeedback.classList.replace('text-danger', 'text-success');

        elementPage.inputUrl.removeAttribute('disabled');
        elementPage.buttonAdd.removeAttribute('disabled');

        elementPage.formRss.reset();
        elementPage.inputUrl.focus();
        break;
      }
      default:
        throw new Error(`Error: undefined status of the loading process '${state.loadingProcess}'`);
    }
  }
};
/* eslint-enable no-param-reassign */

export default render;
