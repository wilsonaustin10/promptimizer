# Privacy Policy - Promptimizer Extension

**Effective Date**: December 2024  
**Last Updated**: December 2024

## Overview

Promptimizer is committed to protecting your privacy while providing valuable prompt optimization services. This policy explains what data we collect, how we use it, and your rights regarding your information.

## 📊 Data Collection

### What We Collect

**Anonymous Usage Analytics** (Optional, enabled by default):
- Anonymous user IDs (generated from browser fingerprint)
- Feature usage patterns (which buttons clicked, which models selected)
- Performance metrics (optimization time, success/failure rates)
- Technical data (extension version, browser type)
- Error logs (anonymized, no personal content)

**Optional Email Addresses**:
- Email addresses (only if you choose to provide them)
- Used exclusively for product updates and feature announcements

### What We DON'T Collect

We explicitly **DO NOT** collect:
- ❌ Your actual prompts or any text content
- ❌ Personal identifying information (name, address, phone)
- ❌ Browsing history or websites visited
- ❌ API keys or credentials
- ❌ Location data or device identifiers
- ❌ Any data that could identify you personally

## 🔐 Data Security

### Encryption & Protection

- **Data in Transit**: All data is encrypted using HTTPS during transmission
- **Data at Rest**: Sensitive data is encrypted using AES-256 encryption
- **Anonymous IDs**: Generated using secure hashing, cannot be reverse-engineered
- **Email Protection**: Email addresses are encrypted and hashed for storage

### Access Controls

- Analytics data is accessible only to authorized maintainers
- Database access is restricted and logged
- No third-party analytics services have access to raw data

## 🎯 Data Usage

### How We Use Your Data

**Usage Analytics**:
- Understand which features are most valuable
- Identify and fix bugs and performance issues
- Improve the extension's functionality
- Measure adoption and engagement

**Email Communications** (if provided):
- Send occasional product updates
- Notify about new features or important changes
- Provide early access to beta features (optional)

### What We Don't Do

We **NEVER**:
- ❌ Sell your data to third parties
- ❌ Use your data for advertising
- ❌ Share individual user data with anyone
- ❌ Track you across other websites
- ❌ Build user profiles for commercial purposes

## 📈 Data Sharing

### Limited Sharing

We only share data in these circumstances:

1. **Aggregated Statistics**: Anonymous, aggregated usage statistics may be shared publicly (e.g., "10,000 prompts optimized this month")
2. **Legal Requirements**: If required by law or to protect our rights
3. **Service Providers**: Encrypted data may be processed by hosting services (Netlify, Vercel) under strict data processing agreements

### No Personal Data Sharing

We never share:
- Individual user analytics
- Email addresses (except to email service providers for delivery)
- Any personally identifiable information

## ⏰ Data Retention

### Automatic Deletion

- **Usage Events**: Automatically deleted after 90 days
- **Error Logs**: Automatically deleted after 30 days
- **Aggregated Metrics**: Kept permanently (fully anonymized)
- **Email Addresses**: Kept until you unsubscribe

### Manual Deletion

You can request immediate deletion of all your data at any time through the extension settings.

## 🛡️ Your Privacy Rights

### Control Your Data

You have the right to:

1. **✅ Opt-Out**: Disable analytics anytime in extension settings
2. **📥 Export Data**: Download all data we have about you
3. **🗑️ Delete Data**: Remove all your data from our systems
4. **📧 Unsubscribe**: Stop email communications anytime
5. **ℹ️ Access Information**: View what data we collect about you

### How to Exercise Your Rights

**In the Extension**:
- Open Settings → Usage Analytics & Updates
- Use the privacy controls to export, delete, or manage your data

**Contact Us**:
- Open an issue on our GitHub repository
- Email: [Your contact email]

## 🌍 International Users

### GDPR Compliance (EU Users)

For users in the European Union, we provide:
- **Lawful Basis**: Legitimate interest for analytics, consent for emails
- **Data Portability**: Export your data in machine-readable format
- **Right to be Forgotten**: Complete data deletion on request
- **Data Protection Officer**: Contact through GitHub issues

### CCPA Compliance (California Users)

For California residents:
- We don't "sell" personal information as defined by CCPA
- You can request deletion of personal information
- You won't face discrimination for exercising your rights

## 🔄 Updates to This Policy

### Notification of Changes

- We'll notify users of significant privacy policy changes
- Updates will be posted in the extension and on GitHub
- Continued use after notification constitutes acceptance

### Version History

- Current version: 1.0 (December 2024)
- Previous versions available on GitHub

## 📞 Contact Information

### Questions or Concerns

**Primary Contact**: GitHub Issues  
Repository: [Your GitHub Repository URL]

**Email**: [Your contact email] (for privacy-specific concerns)

**Response Time**: We aim to respond within 7 business days

## 🔍 Technical Details

### Anonymous ID Generation

```
User ID = SHA256(browser_fingerprint + encryption_key).substring(0, 32)
```

This ensures:
- IDs are consistent for the same browser
- Cannot be reverse-engineered
- Unique across different browsers

### Data Storage Location

- **Analytics Data**: Stored on secure cloud infrastructure (AWS/Google Cloud)
- **Email Data**: Stored with reputable email service providers
- **Backups**: Encrypted and stored in multiple geographic locations

## 📋 Data Processing Details

### Legal Basis (GDPR)

- **Analytics**: Legitimate interest in improving our product
- **Email**: Explicit consent when you provide your email
- **Error Logs**: Legitimate interest in maintaining service quality

### Data Controllers

- **Primary Controller**: Promptimizer Development Team
- **Processors**: Hosting providers (Netlify, Vercel), Email providers

## 🚀 Open Source Commitment

### Transparency

- This extension is open source - you can review all code
- Analytics implementation is fully transparent
- No hidden data collection or tracking

### Community

- Privacy concerns can be raised as GitHub issues
- Community input is welcome on privacy improvements
- Regular security audits by the community

---

**Summary**: We collect minimal, anonymous data to improve Promptimizer while respecting your privacy. Your prompts and personal information are never collected. You have full control over your data and can opt out anytime.

For the latest version of this policy, visit: [GitHub Repository URL]/PRIVACY_POLICY.md