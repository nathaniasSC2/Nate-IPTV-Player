/**
 * VOD Components - Nate IPTV Player
 * Video on Demand and Series browsing components
 */

// Movie Components
export {
  MovieCard,
  MovieCardCompact,
  type MovieCardProps,
  type MovieCardCompactProps,
} from './MovieCard';

export {
  MovieGrid,
  SimpleMovieGrid,
  type MovieGridProps,
  type SimpleMovieGridProps,
  type SortOption,
} from './MovieGrid';

export {
  MovieModal,
  type MovieModalProps,
} from './MovieModal';

// Series Components
export {
  SeriesCard,
  SeriesCardCompact,
  type SeriesCardProps,
  type SeriesCardCompactProps,
} from './SeriesCard';

export {
  SeriesList,
  SimpleSeriesList,
  type SeriesListProps,
  type SimpleSeriesListProps,
  type SeriesSortOption,
} from './SeriesList';

export {
  SeriesModal,
  type SeriesModalProps,
} from './SeriesModal';

// Episode Components
export {
  EpisodeList,
  EpisodeItem,
  CompactEpisodeList,
  type EpisodeListProps,
  type EpisodeItemProps,
  type CompactEpisodeListProps,
} from './EpisodeList';

// Main Browser
export {
  VODBrowser,
  SimpleVODPage,
  type VODBrowserProps,
  type SimpleVODPageProps,
} from './VODBrowser';
