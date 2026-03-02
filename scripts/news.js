/*global scope variables*/
let currentCategory = 'general';

const grid = document.getElementById("grid");
const categoryButtons = document.querySelectorAll('.button');

/*creates DOM content*/
document.addEventListener('DOMContentLoaded', function() {
    switchCategory('general');
});

/*remove active attribute from class list of each button then generate news*/
async function switchCategory(category) {
    currentCategory = category;
     
    categoryButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });
    
    await generateNews(category);
}

async function generateNews(category = 'general') {
  try {
    
    const response = await fetch(`/api/news?category=${encodeURIComponent(category)}`);

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`Backend error ${response.status}: ${msg}`);
    }

    const data = await response.json();
    const articles = (data.articles ?? []).filter(article =>
      article.title && article.description && article.urlToImage
    );

    displayArticles(articles);
  } catch (error) {
    console.log('Error:', error);
  }
}

/*set the innerHTML of the main div to '' then create articles*/
function displayArticles(articles) {
    grid.innerHTML = '';
    
    articles.forEach(article => {
        createArticle(article);
    });
}

/*Progressively generate HTML elements by using JSON properties. Implement two buttons for a link to the article and an AI voice assistant*/ 
async function createArticle(article) {
    const articleElement = document.createElement('div');
    articleElement.className = 'article-card';
    articleElement.dataset.article = JSON.stringify(article);
    
    const publishedDate = new Date(article.publishedAt).toLocaleDateString();
    
    articleElement.innerHTML = `
        <div class="article-image">
            <img src="${article.urlToImage}" alt="${article.title}">
        </div>
        <div class="article-content">
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">
                <span class="article-summary">${article.description}</span>
            </p>
            <div class="article-meta">
                <span class="article-source">${article.source.name}</span>
                <span class="article-date">${publishedDate}</span>
                <span class="sentiment-indicator ${getSentiment(article)}"> ${getSentiment(article)}</span>
            </div>
            <div class="article-actions">
                <a href="${article.url}" target="_blank" class="read-more-button">Read More</a>
                <button class="voice-button" onclick="speakArticle(this)">Listen</button>
            </div>
        </div>
    `;
    
    grid.appendChild(articleElement);

}

/*function that calls to analyze the sentiment of news using the description/title*/
function getSentiment(article) {
    const text = `${article.title} ${article.description}`.toLowerCase();

    const sentiment = analyzeSentiment(text);
    
    return sentiment;
}

/*Creates sets of positve/negative words and counts them. Modifies/returns the results based on positive/negative words/intensifiers*/
function analyzeSentiment(text) {
    
    const strongPositive = ['breakthrough', 'revolutionary', 'incredible', 'amazing', 'outstanding', 'exceptional', 'brilliant', 'spectacular', 'phenomenal', 'remarkable', 'unprecedented', 'historic', 'victory', 'triumph', 'success', 'achievement', 'milestone', 'record-breaking', 'groundbreaking', 'innovative'];
    
    
    const moderatePositive = ['good', 'great', 'excellent', 'positive', 'improve', 'better', 'strong', 'growth', 'advancement', 'successful', 'progress', 'development', 'enhancement', 'boost', 'increase', 'rise', 'gain', 'benefit', 'advantage', 'opportunity'];
    
    
    const strongNegative = ['catastrophic', 'devastating', 'tragic', 'disastrous', 'crisis', 'emergency', 'urgent', 'critical', 'severe', 'extreme', 'terrible', 'horrible', 'awful', 'shocking', 'alarming', 'concerning', 'threatening', 'dangerous', 'harmful', 'destructive'];
    
    
    const moderateNegative = ['bad', 'negative', 'fail', 'loss', 'decline', 'worse', 'weak', 'problem', 'concern', 'threat', 'war', 'bombing', 'punishment', 'jail', 'crime', 'sentence', 'cancelled', 'rejected', 'denied', 'opposed', 'prison', 'difficult'];
    
    
    const intensifiers = ['very', 'extremely', 'highly', 'significantly', 'dramatically', 'massively', 'completely', 'totally', 'absolutely', 'incredibly', 'remarkably', 'substantially'];
    
    
    const negations = ['not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor', 'cannot', 'couldn\'t', 'wouldn\'t', 'shouldn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'don\'t', 'doesn\'t', 'didn\'t'];
    
    let strongPositiveCount = countWords(text, strongPositive);
    let moderatePositiveCount = countWords(text, moderatePositive);
    let strongNegativeCount = countWords(text, strongNegative);
    let moderateNegativeCount = countWords(text, moderateNegative);
    
    const intensifierCount = countWords(text, intensifiers);
    if (intensifierCount > 0) {
        strongPositiveCount *= 1.5;
        strongNegativeCount *= 1.5;
        moderatePositiveCount *= 1.30;
        moderateNegativeCount *= 1.30;
    }
    
    const negationCount = countWords(text, negations);
    if (negationCount > 0) {
        strongPositiveCount *= 0.3;
        moderatePositiveCount *= 0.3;
        strongNegativeCount *= 0.3;
        moderateNegativeCount *= 0.3;
    }
    
    
    const positiveScore = strongPositiveCount + moderatePositiveCount;
    const negativeScore = strongNegativeCount + moderateNegativeCount;
    
    
    const totalScore = positiveScore + negativeScore;
    
    if (totalScore === 0) {
        return 'neutral';
    }
    
    const positiveRatio = positiveScore / totalScore;
    const negativeRatio = negativeScore / totalScore;
    

    if (positiveRatio > 0.60) {
        return 'positive';
    } else if (negativeRatio > 0.60) {
        return 'negative';
    } else if (Math.abs(positiveRatio - negativeRatio) < 0.2) {
        return 'neutral';
    } else if (positiveRatio > negativeRatio) {
        return 'positive';
    } else {
        return 'negative';
    }
}

/*Counts words using regular expression object to match text*/
function countWords(text, wordList) {
    let count = 0;
    for (const word of wordList) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);

        if(matches)
            count += matches.length;
        else  
            count += 0;
    }
    return count;
}

/*speak function that uses built in web speech API to make a voice assistant*/
function speakArticle(button) {
    const articleCard = button.closest('.article-card');
    const articleData = JSON.parse(articleCard.dataset.article);
    
    
    const text = `${articleData.title}. ${articleData.description}`;
    
   
    speechSynthesis.cancel();
        
    const tone = new SpeechSynthesisUtterance(text);
    tone.rate = 0.9;
    tone.pitch = 1;
    tone.volume = 0.8;
        
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.name.includes('Google')
    );

    tone.voice = preferredVoice;
        
    button.textContent = 'Playing';
    button.disabled = true;
        
    tone.onend = () => {
        button.textContent = 'Listen';
        button.disabled = false;
    };
        
    speechSynthesis.speak(tone);
}





