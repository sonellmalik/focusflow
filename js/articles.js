// ===== Productivity Articles =====
const ARTICLES = [
    {
        id: 1,
        title: "The Power of Deep Work",
        author: "Productivity Insights",
        readTime: "5 min read",
        summary: "Learn how to cultivate deep focus and produce high-quality work in less time.",
        content: [
            "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.",
            "In our increasingly distracted world, the ability to perform deep work is becoming both rare and valuable. Those who cultivate this skill will thrive.",
            "The key to deep work is creating rituals. Decide in advance what you'll work on, for how long, and how you'll measure progress. Remove all distractions before you begin.",
            "Your brain needs time to transition into a state of deep focus. Give yourself at least 15-20 minutes of uninterrupted concentration before expecting peak performance.",
            "Schedule your deep work sessions during your peak energy hours. For most people, this is in the morning, but find what works best for your natural rhythm.",
            "Embrace boredom. If you constantly seek stimulation during idle moments, you're training your brain to resist sustained attention. Practice being comfortable with less stimulation."
        ]
    },
    {
        id: 2,
        title: "Time Blocking: A Complete Guide",
        author: "Focus Academy",
        readTime: "4 min read",
        summary: "Master the art of scheduling every minute of your day for maximum productivity.",
        content: [
            "Time blocking is the practice of planning out every moment of your day in advance and dedicating specific hours to accomplish specific tasks.",
            "Unlike a simple to-do list, time blocking tells you when to work on what. This removes the overhead of constantly deciding what to do next.",
            "Start by identifying your most important tasks for the day. These get blocked first during your peak energy hours. Everything else fills in around them.",
            "Be realistic about how long tasks take. Most people underestimate by 50%. Add buffer time between blocks for transitions and unexpected issues.",
            "Protect your time blocks fiercely. Treat them like meetings with yourself that cannot be moved. If something urgent comes up, reschedule the block rather than eliminating it.",
            "Review your time blocks at the end of each day. Note what worked, what didn't, and adjust your strategy for tomorrow."
        ]
    },
    {
        id: 3,
        title: "Breaking the Distraction Cycle",
        author: "Mindful Productivity",
        readTime: "6 min read",
        summary: "Understand why we get distracted and practical strategies to maintain focus.",
        content: [
            "Distractions aren't just about willpower. They're often a response to internal discomfort. We seek distraction to escape boredom, anxiety, or difficult emotions.",
            "The first step to breaking the distraction cycle is awareness. Notice when you reach for your phone or switch tabs. What were you feeling right before?",
            "Create environmental barriers. Put your phone in another room. Use website blockers. Make the distraction harder to access than the work.",
            "The 10-minute rule: When you feel the urge to get distracted, tell yourself you can do it in 10 minutes. Usually, the urge passes and you continue working.",
            "Build a distraction log. Every time you get distracted, note what pulled you away and for how long. Patterns will emerge that you can address systematically.",
            "Remember that focus is a muscle. Each time you resist a distraction and return to your work, you're strengthening your ability to concentrate."
        ]
    },
    {
        id: 4,
        title: "The Pomodoro Technique Mastered",
        author: "Timer Tactics",
        readTime: "4 min read",
        summary: "Go beyond the basics and unlock the full potential of timed work sessions.",
        content: [
            "The Pomodoro Technique isn't just about setting a 25-minute timer. It's a complete system for maintaining sustainable focus throughout the day.",
            "Each pomodoro is a unit of indivisible work. If you're interrupted, the pomodoro doesn't count. This teaches you to protect your focus time aggressively.",
            "The breaks between pomodoros are essential, not optional. Your brain consolidates learning and recovers during rest. Skipping breaks leads to diminishing returns.",
            "Track your pomodoros. Over time, you'll discover how many focused sessions you can sustain daily and which tasks require more cognitive effort than expected.",
            "Adjust the intervals to suit your work style. Some people thrive with 50-minute sessions and 10-minute breaks. Experiment to find your optimal rhythm.",
            "Use the technique as a feedback tool. If you consistently can't complete a task in the estimated pomodoros, you're either underestimating complexity or getting distracted."
        ]
    },
    {
        id: 5,
        title: "Building Sustainable Productivity Habits",
        author: "Habit Science",
        readTime: "5 min read",
        summary: "Create lasting productivity habits without burning out or relying on motivation.",
        content: [
            "Motivation is unreliable. The most productive people don't rely on feeling motivated—they rely on systems and habits that work regardless of how they feel.",
            "Start incredibly small. Want to write daily? Begin with one sentence. Want to exercise? Start with one pushup. The habit of showing up matters more than the intensity.",
            "Attach new habits to existing ones. After your morning coffee, review your time blocks. After lunch, do a quick planning session. These anchors make habits stick.",
            "Track your consistency, not your output. A day where you showed up and did the minimum still counts. Perfectionism kills habits faster than laziness.",
            "Design your environment to support your habits. Keep your workspace clean, your tools ready, and your distractions out of sight. Make the right behavior the easiest behavior.",
            "Recovery is part of productivity. Schedule downtime intentionally. The most sustainable high performers have clear boundaries between work and rest."
        ]
    }
];

let highlights = loadData('highlights', []);
const articlesList = document.getElementById('articles-list');
const articleReader = document.getElementById('article-reader');
const articleContent = document.getElementById('article-content');
const btnBackArticles = document.getElementById('btn-back-articles');

// Render article cards
function renderArticlesList() {
    const cardsHTML = ARTICLES.map(article => `
        <div class="article-card" data-id="${article.id}">
            <h3>${article.title}</h3>
            <div class="article-meta">${article.author} · ${article.readTime}</div>
            <p>${article.summary}</p>
        </div>
    `).join('');

    articlesList.innerHTML = `
        <h2>Productivity Articles</h2>
        <p class="articles-hint">Read articles and highlight your favorite lines. They'll appear on your timer sidebar!</p>
        ${cardsHTML}
    `;

    articlesList.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => openArticle(parseInt(card.dataset.id)));
    });
}

function openArticle(id) {
    const article = ARTICLES.find(a => a.id === id);
    if (!article) return;

    articlesList.style.display = 'none';
    articleReader.style.display = 'block';

    const paragraphs = article.content.map((p, i) => {
        const isHighlighted = highlights.some(h => h.articleId === id && h.paragraphIndex === i);
        return `<p data-article="${id}" data-para="${i}" class="${isHighlighted ? 'highlighted-text' : ''}">${p}</p>`;
    }).join('');

    articleContent.innerHTML = `
        <h1>${article.title}</h1>
        <div class="article-meta">${article.author} · ${article.readTime}</div>
        ${paragraphs}
    `;

    // Add selection highlighting
    setupHighlighting(id);
}

function setupHighlighting(articleId) {
    articleContent.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length < 10) return;

        // Remove existing tooltip
        const existing = document.querySelector('.highlight-tooltip');
        if (existing) existing.remove();

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const tooltip = document.createElement('div');
        tooltip.className = 'highlight-tooltip';
        tooltip.textContent = 'Highlight';
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - 30}px`;
        document.body.appendChild(tooltip);

        tooltip.addEventListener('click', () => {
            // Find paragraph index
            const anchorNode = selection.anchorNode;
            const paragraph = anchorNode.parentElement.closest('p[data-para]');
            const paraIndex = paragraph ? parseInt(paragraph.dataset.para) : 0;

            const article = ARTICLES.find(a => a.id === articleId);
            highlights.push({
                text: selectedText,
                articleId: articleId,
                articleTitle: article.title,
                paragraphIndex: paraIndex
            });
            saveData('highlights', highlights);

            // Mark as highlighted
            if (paragraph) paragraph.classList.add('highlighted-text');

            tooltip.remove();
            selection.removeAllRanges();
            updateQuoteDisplay();
        });

        // Remove tooltip on click elsewhere
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (e.target !== tooltip) {
                    tooltip.remove();
                    document.removeEventListener('click', handler);
                }
            });
        }, 100);
    });
}

btnBackArticles.addEventListener('click', () => {
    articleReader.style.display = 'none';
    articlesList.style.display = 'block';
});

// ===== Quote Display (sidebar on timer page) =====
const quoteText = document.getElementById('quote-text');
const quoteSource = document.getElementById('quote-source');

const defaultQuotes = [
    { text: "The secret of getting ahead is getting started.", source: "Mark Twain" },
    { text: "Focus on being productive instead of busy.", source: "Tim Ferriss" },
    { text: "Until we can manage time, we can manage nothing else.", source: "Peter Drucker" },
    { text: "Ordinary people think merely of spending time. Great people think of using it.", source: "Arthur Schopenhauer" },
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", source: "Stephen Covey" }
];

function updateQuoteDisplay() {
    if (highlights.length > 0) {
        const randomHighlight = highlights[Math.floor(Math.random() * highlights.length)];
        quoteText.textContent = `"${randomHighlight.text}"`;
        quoteSource.textContent = `— Highlighted from: ${randomHighlight.articleTitle}`;
    } else {
        const randomDefault = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
        quoteText.textContent = `"${randomDefault.text}"`;
        quoteSource.textContent = `— ${randomDefault.source}`;
    }
}

// Rotate quotes every 30 seconds
setInterval(updateQuoteDisplay, 30000);

// Initialize
renderArticlesList();
updateQuoteDisplay();
