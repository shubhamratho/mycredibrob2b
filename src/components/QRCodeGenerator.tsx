'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Download, Copy, Share2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface QRCodeGeneratorProps {
  referralLink: string
  userId: string
}

export function QRCodeGenerator({ referralLink, userId }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const qrRef = useRef<SVGSVGElement>(null)

  const copyToClipboard = async () => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea')
        textArea.value = referralLink
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error('Fallback copy failed:', err)
          // Show a prompt as last resort
          prompt('Copy this link:', referralLink)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy: ', err)
      // Show a prompt as fallback
      prompt('Copy this link:', referralLink)
    }
  }

  const downloadQR = async () => {
    setDownloading(true)
    try {
      // Get the SVG element
      const svg = qrRef.current
      if (!svg) {
        throw new Error('QR Code not found')
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svg.cloneNode(true) as SVGSVGElement
      
      // Ensure the SVG has proper styling
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgClone.style.backgroundColor = 'white'
      
      // Create a canvas to convert SVG to image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas not supported')
      }

      // Set canvas size (larger for better quality)
      const size = 400
      canvas.width = size
      canvas.height = size

      // Create an image from the SVG
      const svgData = new XMLSerializer().serializeToString(svgClone)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.onload = () => {
        // Fill canvas with white background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)
        
        // Draw the QR code
        ctx.drawImage(img, 0, 0, size, size)
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create download link
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `qr-code-${userId}.png`
            
            // Trigger download
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Cleanup
            URL.revokeObjectURL(url)
          }
          URL.revokeObjectURL(svgUrl)
          setDownloading(false)
        }, 'image/png')
      }
      
      img.onerror = () => {
        // Fallback: Open QR code in new window for manual save
        const newWindow = window.open()
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>QR Code - Save Image</title></head>
              <body style="margin:0; padding:20px; text-align:center; font-family:Arial;">
                <h3>Right-click and save the QR code below:</h3>
                <div style="background:white; padding:20px; display:inline-block;">
                  ${svgData}
                </div>
                <p>Your referral link: ${referralLink}</p>
              </body>
            </html>
          `)
          newWindow.document.close()
        }
        URL.revokeObjectURL(svgUrl)
        setDownloading(false)
      }
      
      img.src = svgUrl
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback: copy link and show instructions
      await copyToClipboard()
      alert('Download not available. Link copied to clipboard. You can use online QR generators to create an image.')
      setDownloading(false)
    }
  }

  const shareLink = async () => {
    try {
      // Check if Web Share API is available (mainly mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'My Referral Link',
          text: 'Join using my referral link and get started!',
          url: referralLink,
        })
      } else {
        // Fallback for desktop/browsers without Web Share API
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          // Mobile device - try to open native share
          const shareText = `Join using my referral link: ${referralLink}`
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
          window.open(whatsappUrl, '_blank')
        } else {
          // Desktop - copy to clipboard with notification
          await copyToClipboard()
          alert('Link copied to clipboard! You can now paste it anywhere to share.')
        }
      }
    } catch (err) {
      console.error('Error sharing: ', err)
      // Final fallback - just copy to clipboard
      await copyToClipboard()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center p-4 bg-white rounded-lg border">
        <QRCodeSVG
          ref={qrRef}
          value={referralLink}
          size={200}
          level="M"
          includeMargin
          className="block"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQR}
            disabled={downloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download QR'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={shareLink}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        QR code contains your referral link for easy sharing
      </div>
    </div>
  )
}
