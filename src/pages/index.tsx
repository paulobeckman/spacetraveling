import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

import { formatDateToPtBr } from '../utils/formatDate';
import { FaRegCalendar , FaRegUser} from 'react-icons/fa';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [hasMorePosts, setHasMorePosts] = useState(!!postsPagination.next_page);
  
  async function handleLoadMorePosts(): Promise<void> {
    const loadMorePostsResponse: ApiSearchResponse = await (
      await fetch(postsPagination.next_page)
    ).json();

    setPosts([...posts, ...loadMorePostsResponse.results]);
    setHasMorePosts(!!loadMorePostsResponse.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`} >
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <time>
                    <FaRegCalendar />
                    {formatDateToPtBr(post.first_publication_date)}
                  </time>
                  <span>
                    <FaRegUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          {!!hasMorePosts && (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  return {
    props: {
      postsPagination: response,
    },
    revalidate: 60 * 30 // 30 min
  }
}
