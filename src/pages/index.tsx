import { GetStaticProps } from 'next';
import { FaRegCalendar , FaRegUser} from 'react-icons/fa';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../services/prismic';

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
  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {postsPagination.results.map(post => (
            <Link href={`/posts/${post.uid}`} >
              <a key={post.uid}>
                 <strong>{post.data.title}</strong>
                 <p>{post.data.subtitle}</p>

                 <footer>
                   <section>
                    <FaRegCalendar />
                    <time>{post.first_publication_date}</time>
                   </section>
                   <section>
                    <FaRegUser />
                    <p>{post.data.author}</p>
                   </section>
                 </footer>
              </a>
            </Link>
          ))}
        <a href="">Carregar mais posts</a>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  })

  // console.log(JSON.stringify(response, null, 2))

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(post.first_publication_date).toLocaleDateString('nl', {
        day: '2-digit',
        month: `short`,
        year: 'numeric'
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination ={
    results
  }

  return {
    props: {postsPagination}
  }
}
