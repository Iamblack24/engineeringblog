import React from 'react';
import ArticleCard from '../components/ArticleCard';
import './ArticlesPage.css'; // Import the CSS file for styling

const articles = [
  {
    id: 1,
    title: 'Understanding Structural Engineering',
    author: 'John Doe',
    date: '2023-01-15',
    likes: 120,
    dislikes: 5,
    photo: '/path/to/photo.jpg' // Add a photo path for the article
  },
  {
    id: 2,
    title: 'Sustainable Construction Practices',
    author: 'Jane Smith',
    date: '2023-02-10',
    likes: 98,
    dislikes: 2,
    photo: '/path/to/photo.jpg' // Add a photo path for the article
  },
  // Add more articles here
];

const ArticlesPage = () => {
  return (
    <div className="articles-page">
      <h1>Articles</h1>
      <div className="articles-list">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            id={article.id}
            title={article.title}
            author={article.author}
            date={article.date}
            likes={article.likes}
            dislikes={article.dislikes}
            photo={article.photo}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticlesPage;