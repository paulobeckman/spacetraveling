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
  function date(timestamp){
    const date = new Date(timestamp)
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul","Ago","Set","Out","Nov","Dez"];

    const year = date.getUTCFullYear()
    const month = meses[date.getUTCMonth()]
    const day = `0${date.getUTCDate()}`.slice(-2)

    return {
        format: `${day} ${month} ${year}`
    }
  }
  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {postsPagination.results.map(post => (
            <Link key={post.uid} href={`/posts/${post.uid}`} >
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <footer>
                  <section>
                    <FaRegCalendar />
                    <time>{date(post.first_publication_date).format}</time>
                  </section>
                  <section>
                    <FaRegUser />
                    <p>{post.data.author}</p>
                  </section>
                </footer>
              </a>
            </Link>
          ))}
        <a href={postsPagination.next_page}>Carregar mais posts</a>
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
    pageSize: 1,
    page: 1,
  })

  // console.log(JSON.stringify(response, null, 2))

  const results = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const next_page = response.next_page

  const postsPagination ={
    results,
    next_page
  }

  return {
    props: {postsPagination}
  }
}
