'use client'
import { useState, useEffect, useRef } from 'react'
import { FiSun, FiMoon, FiHome, FiBriefcase, FiMail, FiUser, FiClock, FiChevronRight, FiStar, FiSend, FiMessageSquare, FiMenu, FiX } from 'react-icons/fi'
import { FaLinkedin, FaGithub, FaInstagram, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA0KPU9a7RTVO7Ct1ZOELYlyBEIM7Acwg",
  authDomain: "utstest-5dbc9.firebaseapp.com",
  projectId: "utstest-5dbc9",
  storageBucket: "utstest-5dbc9.firebasestorage.app",
  messagingSenderId: "384274698057",
  appId: "1:384274698057:web:a7c35b562abe5005e11498"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [activePortfolio, setActivePortfolio] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 })
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your CV assistant. How can I help you today?' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to specific section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false)
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true)
    }

    // Load comments and ratings from Firestore
    const commentsQuery = query(collection(db, 'comments'), orderBy('timestamp', 'desc'))
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setComments(loadedComments)
    })

    const ratingsQuery = collection(db, 'ratings')
    const unsubscribeRatings = onSnapshot(ratingsQuery, (snapshot) => {
      const ratings = snapshot.docs.map(doc => doc.data().rating)
      const average = ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0
      setRatingStats({
        average,
        count: ratings.length
      })
    })

    return () => {
      unsubscribeComments()
      unsubscribeRatings()
    }
  }, [])

  useEffect(() => {
    // Apply theme class to document
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => {
    setDarkMode(!darkMode)
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await addDoc(collection(db, 'comments'), {
        text: newComment,
        name: 'Anonymous',
        timestamp: serverTimestamp()
      })
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment: ', error)
    }
  }

  const handleRatingSubmit = async () => {
    if (userRating === 0) return

    try {
      await addDoc(collection(db, 'ratings'), {
        rating: userRating,
        timestamp: serverTimestamp()
      })
      setUserRating(0)
    } catch (error) {
      console.error('Error adding rating: ', error)
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const portfolioItems = [
    {
      id: 1,
      title: 'Frontend Developer at TechCorp',
      period: '2022 - Present',
      description: 'Developed responsive web applications using React and Next.js. Led the migration from class components to functional components with hooks.',
      color: 'bg-pink-500'
    },
    {
      id: 2,
      title: 'UI/UX Designer at DesignHub',
      period: '2020 - 2022',
      description: 'Created wireframes and prototypes for client projects. Conducted user research and usability testing.',
      color: 'bg-purple-500'
    },
    {
      id: 3,
      title: 'Web Development Intern at StartupX',
      period: '2019 - 2020',
      description: 'Assisted in building and maintaining company website. Learned modern web development practices.',
      color: 'bg-indigo-500'
    }
  ]

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />)
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />)
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />)
      }
    }

    return stars
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FiUser className="text-pink-500 text-xl" />
            <span className="font-bold text-lg">CV</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <button onClick={() => scrollToSection('profile')} className="flex items-center hover:text-pink-500 transition-colors">
              <FiHome className="mr-1" /> Home
            </button>
            <button onClick={() => scrollToSection('experience')} className="flex items-center hover:text-pink-500 transition-colors">
              <FiBriefcase className="mr-1" /> Portfolio
            </button>
            <button onClick={() => scrollToSection('rating')} className="flex items-center hover:text-pink-500 transition-colors">
              <FiStar className="mr-1" /> Rate
            </button>
            <button onClick={() => scrollToSection('comments')} className="flex items-center hover:text-pink-500 transition-colors">
              <FiMail className="mr-1" /> Comments
            </button>
            <button onClick={() => scrollToSection('assistant')} className="flex items-center hover:text-pink-500 transition-colors">
              <FiMessageSquare className="mr-1" /> Assistant
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} py-2`}>
            <button onClick={() => scrollToSection('profile')} className="w-full px-4 py-2 flex items-center hover:text-pink-500 transition-colors">
              <FiHome className="mr-2" /> Home
            </button>
            <button onClick={() => scrollToSection('experience')} className="w-full px-4 py-2 flex items-center hover:text-pink-500 transition-colors">
              <FiBriefcase className="mr-2" /> Portfolio
            </button>
            <button onClick={() => scrollToSection('rating')} className="w-full px-4 py-2 flex items-center hover:text-pink-500 transition-colors">
              <FiStar className="mr-2" /> Rate
            </button>
            <button onClick={() => scrollToSection('comments')} className="w-full px-4 py-2 flex items-center hover:text-pink-500 transition-colors">
              <FiMail className="mr-2" /> Comments
            </button>
            <button onClick={() => scrollToSection('assistant')} className="w-full px-4 py-2 flex items-center hover:text-pink-500 transition-colors">
              <FiMessageSquare className="mr-2" /> Assistant
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Profile Section */}
        <section id="profile" className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-pink-300 shadow-lg mx-auto md:mx-0">
            <img 
              src="profile.jpg" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Ardelia Finastika Aufa</h1>
            <h2 className="text-xl md:text-2xl text-pink-500 font-semibold mb-4">Frontend Developer & UI Designer</h2>
            <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Passionate about creating beautiful, user-friendly interfaces with clean code. 
              Experienced in React, Next.js, and modern CSS frameworks.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <a href="#" className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors">
                <FaLinkedin className="text-xl" />
              </a>
              <a href="#" className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors">
                <FaGithub className="text-xl" />
              </a>
              <a href="#" className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors">
                <FaInstagram className="text-xl" />
              </a>
              <a href="mailto:sarah@example.com" className={`flex items-center px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                <FiMail className="mr-2" /> Email Me
              </a>
            </div>
          </div>
        </section>

        {/* Portfolio Timeline */}
        <section id="experience" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-center md:justify-start">
            <FiBriefcase className="mr-2 text-pink-500" /> My Experience
          </h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className={`absolute left-5 top-0 h-full w-0.5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} md:left-1/2 md:-ml-1`}></div>
            
            {portfolioItems.map((item, index) => (
              <div 
                key={item.id} 
                className={`relative mb-8 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'} md:w-1/2 ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}
                onClick={() => setActivePortfolio(item)}
              >
                <div className={`absolute top-4 rounded-full w-10 h-10 flex items-center justify-center ${item.color} text-white shadow-lg cursor-pointer transform hover:scale-110 transition-transform ${index % 2 === 0 ? 'left-0 md:left-auto md:right-0 md:-mr-5' : 'left-0 md:-ml-5'}`}>
                  <FiClock />
                </div>
                <div className={`p-6 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} ${index % 2 === 0 ? 'ml-12 md:ml-0' : 'ml-12'}`}>
                  <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                  <p className={`font-semibold mb-2 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>{item.period}</p>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.description}</p>
                  <div className="mt-3 flex items-center">
                    <span className={`text-sm ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>View details</span>
                    <FiChevronRight className={`ml-1 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ratings Section */}
        <section id="rating" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-center md:justify-start">
            <FiStar className="mr-2 text-pink-500" /> Rate This CV
          </h2>
          
          <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex flex-col md:flex-row items-center mb-4">
              <div className="flex mb-4 md:mb-0 md:mr-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                    className="text-2xl mx-1"
                  >
                    {star <= (hoverRating || userRating) ? (
                      <FaStar className="text-yellow-400" />
                    ) : (
                      <FaRegStar className="text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRatingSubmit}
                disabled={userRating === 0}
                className={`px-4 py-2 rounded-lg ${userRating === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'} text-white transition-colors w-full md:w-auto`}
              >
                Submit Rating
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex mb-2 md:mb-0 md:mr-2">
                {renderStars(ratingStats.average)}
              </div>
              <span className="font-semibold">
                Rating {ratingStats.average} (from {ratingStats.count} voters)
              </span>
            </div>
          </div>
        </section>

        {/* Comments Section */}
        <section id="comments" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-center md:justify-start">
            <FiMail className="mr-2 text-pink-500" /> Comments
          </h2>
          
          <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex flex-col md:flex-row">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment..."
                  className={`flex-1 px-4 py-2 rounded-lg md:rounded-l-lg md:rounded-r-none border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} mb-2 md:mb-0`}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-lg md:rounded-r-lg md:rounded-l-none ${!newComment.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'} text-white transition-colors`}
                >
                  <FiSend className="inline mr-1" /> Send
                </button>
              </div>
            </form>
            
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                      <span className="font-semibold">{comment.name}</span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {comment.timestamp?.toDate().toLocaleString()}
                      </span>
                    </div>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* AI Chatbot Section */}
        <section id="assistant" className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center justify-center md:justify-start">
            <FiMessageSquare className="mr-2 text-pink-500" /> CV Assistant
          </h2>
          
          <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="mb-4 h-64 overflow-y-auto p-3 rounded-lg" style={{ maxHeight: '256px' }}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block px-3 py-2 rounded-lg max-w-xs ${msg.role === 'user' 
                      ? darkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white' 
                      : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-3">
                  <div className={`inline-block px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'}`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="mt-4">
              <div className="flex flex-col md:flex-row">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about this CV..."
                  className={`flex-1 px-4 py-2 rounded-lg md:rounded-l-lg md:rounded-r-none border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} mb-2 md:mb-0`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className={`px-4 py-2 rounded-lg md:rounded-r-lg md:rounded-l-none ${!inputMessage.trim() || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500 hover:bg-pink-600'} text-white transition-colors`}
                >
                  <FiSend className="inline mr-1" /> Send
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      {/* Portfolio Detail Modal */}
      {activePortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`relative rounded-lg shadow-xl max-w-2xl w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <button 
              onClick={() => setActivePortfolio(null)}
              className={`absolute top-4 right-4 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-2">{activePortfolio.title}</h3>
            <p className={`font-semibold mb-4 ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>{activePortfolio.period}</p>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{activePortfolio.description}</p>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className="font-bold mb-2">Key Responsibilities:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Developed and maintained responsive web applications</li>
                <li>Collaborated with designers to implement UI/UX designs</li>
                <li>Optimized applications for maximum speed and scalability</li>
                <li>Participated in code reviews and team meetings</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className={`fixed bottom-6 left-6 p-3 rounded-full shadow-lg ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-white text-gray-800'}`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
      </button>
    </div>
  )
}