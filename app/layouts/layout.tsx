import BLOG from '#/blog.config';
import { Link, useNavigate } from '@remix-run/react';
import dayjs from 'dayjs';
import { ExtendedRecordMap } from 'notion-types';
import type { TableOfContentsEntry } from 'notion-utils';
import { Suspense, lazy, useMemo } from 'react';
import { NotionRenderer } from 'react-notion-x';
import { Theme, useTheme } from 'remix-themes';
import { ClientOnly } from '~/components/ClientOnly';
import Container from '~/components/Container';
import PostActions from '~/components/PostActions';
import TableOfContent from '~/components/TableOfContent';
import TagItem from '~/components/TagItem';
import { useLocale } from '~/libs/locale';
import { mapImageUrl, mapPageUrl } from '~/libs/utils';

const Comments = lazy(() => import('~/components/Comments'));
const Code = lazy(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    await import('prismjs/prism.js');

    await Promise.all([
      import('prismjs/components/prism-bash.js'),
      import('prismjs/components/prism-diff.js'),
      import('prismjs/components/prism-go.js'),
      import('prismjs/components/prism-yaml.js'),
      import('prismjs/components/prism-rust.js'),
      import('prismjs/components/prism-python.js'),
      import('prismjs/components/prism-markup-templating.js'),
      import('prismjs/components/prism-php.js'),
      import('prismjs/components/prism-javascript.js'),
      import('prismjs/components/prism-markup.js'),
      import('prismjs/components/prism-typescript.js'),
      import('prismjs/components/prism-jsx.js'),
      import('prismjs/components/prism-less.js'),
      import('prismjs/components/prism-js-templates.js'),
      import('prismjs/components/prism-git.js'),
      import('prismjs/components/prism-graphql.js'),
      import('prismjs/components/prism-solidity.js'),
      import('prismjs/components/prism-sql.js'),
      import('prismjs/components/prism-wasm.js'),
      import('prismjs/components/prism-yaml.js'),
    ]);
    return {
      default: m.Code,
    };
  })
);
const Collection = lazy(() =>
  import('react-notion-x/build/third-party/collection').then((m) => ({
    default: m.Collection,
  }))
);
const Equation = lazy(() =>
  import('react-notion-x/build/third-party/equation').then((m) => ({
    default: m.Equation,
  }))
);
const TweetEmbed = lazy(() => import('react-tweet-embed'));

const Tweet = ({ id }: { id: string }) => {
  return (
    <Suspense fallback="">
      <TweetEmbed tweetId={id} />
    </Suspense>
  );
};

interface LayoutProps {
  blockMap: ExtendedRecordMap;
  frontMatter: any;
  fullWidth?: boolean;
  coverImage?: string;
  tableOfContent?: TableOfContentsEntry[];
  theme: Theme;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  coverImage,
  blockMap,
  tableOfContent,
  frontMatter,
  fullWidth = false,
}) => {
  const locale = useLocale();
  const navigate = useNavigate();
  const [theme] = useTheme();
  const date = frontMatter?.date?.start_date || frontMatter.createdTime;

  const components = useMemo(
    () => ({
      Equation: (props) => (
        <Suspense fallback="">
          <Equation {...props} />
        </Suspense>
      ),
      Code: (props) => (
        <Suspense fallback="">
          <Code {...props} />
        </Suspense>
      ),
      Collection: (props) => (
        <ClientOnly>
          {() => {
            console.log('Collection', Collection);
            return (
              <Suspense fallback="">
                <Collection {...props} />
              </Suspense>
            );
          }}
        </ClientOnly>
      ),
      nextLink: (props) => <Link to={props.href} {...props} />,
      Tweet,
    }),
    []
  );

  return (
    <Container
      layout="blog"
      title={frontMatter.title}
      description={frontMatter.summary}
      coverImage={coverImage}
      // date={new Date(frontMatter.publishedAt).toISOString()}
      type="article"
      fullWidth={fullWidth}
    >
      <div className="flex flex-row">
        <article className="md:overflow-x-visible overflow-x-scroll w-full">
          <h1 className="font-bold text-3xl text-black dark:text-white">
            {frontMatter.title}
          </h1>
          {frontMatter.type !== 'Page' && (
            <nav className="flex my-7 items-start text-gray-500 dark:text-gray-400">
              <div className="flex mb-4">
                <a
                  href={BLOG.socialLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex"
                >
                  <img
                    alt={BLOG.author}
                    width={24}
                    height={24}
                    src={BLOG.authorAvatar}
                    className="rounded-full"
                  />
                  <p className="ml-2 md:block">{BLOG.author}</p>
                </a>
                <span className="block">&nbsp;/&nbsp;</span>
              </div>
              {dayjs(date).isValid() ? (
                <div className="mr-2 mb-4 md:ml-0">
                  {dayjs(
                    frontMatter?.date?.start_date || frontMatter.createdTime
                  ).format(BLOG.dateFormat)}
                </div>
              ) : null}
              {frontMatter.tags && (
                <div className="flex flex-nowrap max-w-full overflow-x-auto article-tags">
                  {frontMatter.tags.map((tag) => (
                    <TagItem key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </nav>
          )}
          {children}
          {blockMap && (
            <div className={frontMatter.type !== 'Page' ? '-mt-4' : ''}>
              <NotionRenderer
                recordMap={blockMap}
                components={components}
                mapPageUrl={mapPageUrl}
                previewImages={!!blockMap.preview_images}
                rootDomain={new URL(BLOG.link)?.host}
                mapImageUrl={mapImageUrl}
                darkMode={theme === Theme.DARK}
                pageAside={false}
              />
            </div>
          )}
        </article>
        {frontMatter.type !== 'Page' && (
          <aside className="md:flex md:ml-4 sticky md:flex-col md:items-center md:top-36 md:self-start md:flex-auto hidden">
            {tableOfContent.length > 0 && (
              <TableOfContent
                className="mb-6"
                tableOfContent={tableOfContent}
                mobile
              />
            )}
            <PostActions title={frontMatter.title} />
          </aside>
        )}
      </div>
      <div className="flex justify-between font-medium text-gray-500 dark:text-gray-400 my-5">
        <a>
          <button
            onClick={() => navigate(BLOG.path || '/')}
            className="mt-2 cursor-pointer hover:text-black dark:hover:text-gray-100"
          >
            ← {locale.POST.BACK}
          </button>
        </a>
        <a>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-2 cursor-pointer hover:text-black dark:hover:text-gray-100"
          >
            ↑ {locale.POST.TOP}
          </button>
        </a>
      </div>
      {frontMatter.type !== 'Page' && (
        <Suspense fallback="">
          <Comments frontMatter={frontMatter} />
        </Suspense>
      )}
    </Container>
  );
};

export default Layout;
