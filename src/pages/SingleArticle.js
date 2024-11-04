import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './SingleArticle.css'; // Import the CSS file for styling

const articles = [
  {
    id: 1,
    title: 'Understanding Structural Engineering',
    author: 'John Doe',
    date: '2023-01-15',
    content: `
      Structural engineering is a sub-discipline of civil engineering in which structural engineers are trained to design the 'bones and muscles' that create the form and shape of man-made structures. Structural engineers need to understand and calculate the stability, strength, rigidity, and earthquake-susceptibility of built structures for buildings and nonbuilding structures. The structural designs are integrated with those of other designers such as architects and building services engineer and often supervise the construction of projects by contractors on site. They can also be involved in the design of machinery, medical equipment, and vehicles where structural integrity affects functioning and safety.
      
      Structural engineering theory is based upon applied physical laws and empirical knowledge of the structural performance of different materials and geometries. Structural engineering design utilizes a number of relatively simple structural elements to build complex structural systems. Structural engineers are responsible for making creative and efficient use of funds, structural elements, and materials to achieve these goals.
    `,
    likes: 120,
    dislikes: 5,
  },
  {
    id: 2,
    title: 'Sustainable Construction Practices',
    author: 'Jane Smith',
    date: '2023-02-10',
    content: `
      Sustainable construction is the practice of creating a healthy environment that's based on ecological principles. The main goals of sustainable construction are to reduce the industry's impact on the environment. This can be achieved through the use of sustainable building materials, energy-efficient designs, and waste reduction practices.
      
      Sustainable construction practices include the use of renewable and recyclable materials, reducing energy consumption and waste, and ensuring that the building's design and construction have minimal impact on the environment. This approach not only helps in conserving natural resources but also in creating healthier living environments for people.
      
      Some common sustainable construction practices include:
      - Using energy-efficient building materials and systems
      - Implementing water-saving techniques
      - Reducing waste and recycling materials
      - Using renewable energy sources
      - Designing buildings to maximize natural light and ventilation
      
      By adopting these practices, the construction industry can significantly reduce its environmental footprint and contribute to a more sustainable future.
    `,
    likes: 98,
    dislikes: 2,
  },
  // Add more articles here
];

const SingleArticle = () => {
  const { id } = useParams();
  const article = articles.find(article => article.id === parseInt(id));

  const [likes, setLikes] = useState(article.likes);
  const [dislikes, setDislikes] = useState(article.dislikes);

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="single-article">
      <h1>{article.title}</h1>
      <p className="article-meta">
        <span>By {article.author}</span> | <span>{article.date}</span>
      </p>
      <div className="article-content">
        {article.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      <div className="article-stats">
        <span role="img" aria-label="likes" onClick={() => setLikes(likes + 1)}>👍</span> {likes} | 
        <span role="img" aria-label="dislikes" onClick={() => setDislikes(dislikes + 1)}>👎</span> {dislikes}
      </div>
    </div>
  );
};

export default SingleArticle;