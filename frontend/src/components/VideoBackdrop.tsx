import { useEffect, useState } from 'react'
import './VideoBackdrop.css'

const videos = [
  { src: '/mon_vids/Salmonad_of_Empathetic_Dealer.mp4', name: 'Salmonad' },
  { src: '/mon_vids/Molandak_s_Security_Video_Generation.mp4', name: 'Molandak' },
  { src: '/mon_vids/Chog_s_High_Stakes_Casino_Video.mp4', name: 'Chog' },
  { src: '/mon_vids/Mouch_the_jackpot_charm.mp4', name: 'Mouch' },
  { src: '/mon_vids/Mokadel__the_fortuneteller.mp4', name: 'Mokadel' },
  { src: '/mon_vids/Mosferatu__the_VIP_handler_2.mp4', name: 'Mosferatu' },
]

export default function VideoBackdrop() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  useEffect(() => {
    // Change video every 30 seconds with smooth transition
    const interval = setInterval(() => {
      setIsTransitioning(true)
      
      setTimeout(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
        setIsTransitioning(false)
      }, 1000) // 1 second fade transition
    }, 30000) // Change every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="video-backdrop-container">
      <video
        key={videos[currentVideoIndex].src}
        className={`video-backdrop-main ${isTransitioning ? 'transitioning' : ''}`}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={videos[currentVideoIndex].src} type="video/mp4" />
      </video>
      
      {/* Gradient overlay for better text readability */}
      <div className="video-gradient-overlay" />
    </div>
  )
}
