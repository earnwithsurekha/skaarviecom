const axios = require('axios');

/**
 * MSG91 SMS Utility
 * Documentation: https://docs.msg91.com/
 */

class SMSService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.senderId = process.env.MSG91_SENDER_ID || 'SKAARV';
    this.dltEntityId = process.env.MSG91_DLT_ENTITY_ID;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.baseURL = 'https://control.msg91.com/api/v5';
    this.otpBaseURL = 'https://control.msg91.com/api/v5/otp';
  }

  /**
   * Send OTP using MSG91 OTP API
   * @param {string} mobile - 10-digit mobile number (without country code)
   * @param {string} otp - 4 or 6 digit OTP
   * @param {string} templateId - Optional template ID (uses default if not provided)
   */
  async sendOTP(mobile, otp, templateId = null) {
    try {
      if (!this.authKey) {
        console.error('[SMS] MSG91_AUTH_KEY not configured');
        throw new Error('SMS service not configured');
      }

      // Clean mobile number (remove spaces, dashes, etc.)
      let cleanMobile = mobile.replace(/\D/g, '');
      
      // Remove country code if present (91 for India)
      if (cleanMobile.startsWith('91') && cleanMobile.length > 10) {
        cleanMobile = cleanMobile.substring(2);
      }
      
      // Validate mobile number
      if (cleanMobile.length !== 10) {
        throw new Error('Invalid mobile number. Must be 10 digits.');
      }

      const payload = {
        template_id: templateId || this.templateId,
        mobile: `91${cleanMobile}`, // Add India country code
        authkey: this.authKey,
        otp: otp,
      };

      console.log('[SMS] Sending OTP to:', cleanMobile);

      // Build URL with DLT Entity ID if available
      let url = `${this.otpBaseURL}?authkey=${this.authKey}&mobile=91${cleanMobile}&template_id=${payload.template_id}&otp=${otp}`;
      if (this.dltEntityId) {
        url += `&DLT_TE_ID=${this.dltEntityId}`;
      }

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[SMS] OTP sent successfully:', response.data);

      return {
        success: true,
        message: 'OTP sent successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('[SMS] Error sending OTP:', error.response?.data || error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Verify OTP using MSG91
   * @param {string} mobile - 10-digit mobile number
   * @param {string} otp - OTP to verify
   */
  async verifyOTP(mobile, otp) {
    try {
      if (!this.authKey) {
        throw new Error('SMS service not configured');
      }

      const cleanMobile = mobile.replace(/\D/g, '');

      const response = await axios.get(
        `${this.otpBaseURL}/verify?authkey=${this.authKey}&mobile=91${cleanMobile}&otp=${otp}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[SMS] OTP verified:', response.data);

      return {
        success: response.data.type === 'success',
        message: response.data.message,
        data: response.data,
      };
    } catch (error) {
      console.error('[SMS] Error verifying OTP:', error.response?.data || error.message);
      
      return {
        success: false,
        message: 'Invalid OTP',
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Resend OTP
   * @param {string} mobile - 10-digit mobile number
   * @param {string} retryType - 'text' or 'voice'
   */
  async resendOTP(mobile, retryType = 'text') {
    try {
      if (!this.authKey) {
        throw new Error('SMS service not configured');
      }

      const cleanMobile = mobile.replace(/\D/g, '');

      const response = await axios.post(
        `${this.otpBaseURL}/retry?authkey=${this.authKey}&mobile=91${cleanMobile}&retrytype=${retryType}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[SMS] OTP resent:', response.data);

      return {
        success: true,
        message: 'OTP resent successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('[SMS] Error resending OTP:', error.response?.data || error.message);
      
      return {
        success: false,
        message: 'Failed to resend OTP',
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Send custom SMS message (not OTP)
   * @param {string} mobile - 10-digit mobile number or array of mobile numbers
   * @param {string} message - Message content
   * @param {string} route - SMS route: 'transactional' or 'promotional'
   */
  async sendSMS(mobile, message, route = 'transactional') {
    try {
      if (!this.authKey) {
        throw new Error('SMS service not configured');
      }

      // Handle single mobile or array
      const mobileNumbers = Array.isArray(mobile) ? mobile : [mobile];
      const cleanNumbers = mobileNumbers.map(m => `91${m.replace(/\D/g, '')}`);

      const payload = {
        sender: this.senderId,
        route: route === 'promotional' ? '1' : '4', // 1=Promotional, 4=Transactional
        country: '91',
        sms: [
          {
            message: message,
            to: cleanNumbers,
          },
        ],
      };

      // Add DLT Entity ID if available
      if (this.dltEntityId) {
        payload.DLT_TE_ID = this.dltEntityId;
      }

      console.log('[SMS] Sending message to:', cleanNumbers);

      const response = await axios.post(
        `${this.baseURL}/flow/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'authkey': this.authKey,
          },
        }
      );

      console.log('[SMS] Message sent successfully:', response.data);

      return {
        success: true,
        message: 'SMS sent successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('[SMS] Error sending SMS:', error.response?.data || error.message);
      
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Send order notification SMS
   * @param {string} mobile - Customer mobile number
   * @param {string} orderNumber - Order number
   * @param {number} amount - Order amount
   */
  async sendOrderConfirmation(mobile, orderNumber, amount) {
    const message = `Dear Customer, Your order ${orderNumber} of Rs.${amount} has been confirmed. Track your order on SKAARVI app. - SKAARVI`;
    return await this.sendSMS(mobile, message, 'transactional');
  }

  /**
   * Send order shipped notification
   * @param {string} mobile - Customer mobile number
   * @param {string} orderNumber - Order number
   * @param {string} trackingUrl - Tracking URL
   */
  async sendOrderShipped(mobile, orderNumber, trackingUrl) {
    const message = `Your order ${orderNumber} has been shipped! Track here: ${trackingUrl} - SKAARVI`;
    return await this.sendSMS(mobile, message, 'transactional');
  }

  /**
   * Send order delivered notification
   * @param {string} mobile - Customer mobile number
   * @param {string} orderNumber - Order number
   */
  async sendOrderDelivered(mobile, orderNumber) {
    const message = `Your order ${orderNumber} has been delivered. Thank you for shopping with SKAARVI!`;
    return await this.sendSMS(mobile, message, 'transactional');
  }

  /**
   * Send payment reminder
   * @param {string} mobile - Customer mobile number
   * @param {number} amount - Pending amount
   */
  async sendPaymentReminder(mobile, amount) {
    const message = `Reminder: Your payment of Rs.${amount} is pending. Please complete payment to process your order. - SKAARVI`;
    return await this.sendSMS(mobile, message, 'transactional');
  }

  /**
   * Check SMS delivery status
   * @param {string} requestId - Request ID from send SMS response
   */
  async checkDeliveryStatus(requestId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/report/message?authkey=${this.authKey}&request_id=${requestId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('[SMS] Error checking status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new SMSService();
