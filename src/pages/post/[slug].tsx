import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { formatDateToPtBr } from '../../utils/formatDate';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  last_publication_date: string | null;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
}

export default function Post({ post, preview, nextPost, prevPost }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Post | spacetraveling</title>
        </Head>
        <Header />
        <main className={commonStyles.container}>Carregando...</main>
      </>
    );
  }

  const estimatedReadTime = useMemo(() => {
    if (router.isFallback) return 0;

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;
        const bodyWords = currentContent.body.reduce(
          (summedBodies, currentBody) => {
            const textWords = currentBody.text.split(/\s/g).length;
            return summedBodies + textWords;
          },
          0
        );
        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  const isPostEdited =
    post.last_publication_date &&
    post.last_publication_date !== post.first_publication_date;

  return (
    <>
      <Head>
          <title>{post.data.title}</title>
      </Head>

      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
        <div className={commonStyles.container}>
          <article className={styles.article}>
            <h1>{post.data.title}</h1>
            <div className={commonStyles.info}>
              <time>
                <FiCalendar />
                {formatDateToPtBr(post.first_publication_date)}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
              <time>
                <FiClock />
                {estimatedReadTime} min
              </time>
            </div>
            {post.data.content.map(post => (
              <section key={post.heading} className={styles.post}>
                <h2>{post.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(post.body),
                  }}
                />
              </section>
            ))}
          </article>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {pageSize: 3}
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params, 
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if(!response) {
    return {
      notFound: true,
    };
  }

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];

  return {
    props: {
      post: response,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 60, // 1h
  }

};
