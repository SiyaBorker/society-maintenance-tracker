const express = require('express');
const dns = require('node:dns');
const net = require('node:net');

// Temporary diagnostic route to isolate whether Gmail SMTP connectivity
// failures on Render happen at DNS resolution or at the raw TCP layer,
// independent of Nodemailer. Remove once the ENETUNREACH issue is resolved.
const router = express.Router();

function lookup(family) {
  return new Promise((resolve) => {
    dns.lookup('smtp.gmail.com', { family }, (err, address) => {
      if (err) {
        resolve({ success: false, error: err.code || err.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

function tcpConnect(address, port) {
  return new Promise((resolve) => {
    if (!address) {
      resolve({ success: false, error: 'skipped (no address resolved)' });
      return;
    }

    const socket = net.connect({ host: address, port, timeout: 5000 });
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.on('connect', () => finish({ success: true }));
    socket.on('timeout', () => finish({ success: false, error: 'ETIMEDOUT' }));
    socket.on('error', (err) => finish({ success: false, error: err.code || err.message }));
  });
}

router.get('/smtp-check', async (req, res) => {
  const [dnsIpv4, dnsIpv6] = await Promise.all([lookup(4), lookup(6)]);

  const [tcpIpv4, tcpIpv6] = await Promise.all([
    tcpConnect(dnsIpv4.success ? dnsIpv4.address : null, 465),
    tcpConnect(dnsIpv6.success ? dnsIpv6.address : null, 465),
  ]);

  res.json({
    dns_ipv4: dnsIpv4,
    dns_ipv6: dnsIpv6,
    tcp_ipv4_465: tcpIpv4,
    tcp_ipv6_465: tcpIpv6,
  });
});

module.exports = router;
