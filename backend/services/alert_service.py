import time
import threading
import smtplib
from email.message import EmailMessage

class AlertService:
    def __init__(self):
        self.alerts = [] # list of dicts: {email, phone, symbol, target, buy, sl}
        self.running = False
        self.thread = None

    def add_alert(self, email, phone, symbol, target, buy, sl):
        self.alerts.append({
            "email": email,
            "phone": phone,
            "symbol": symbol.upper(),
            "target": target,
            "buy": buy,
            "sl": sl
        })
        print(f"[AlertService] Added alert for {symbol} -> Email: {email}, Phone: {phone}")

    def send_email(self, to_email, subject, body):
        """Mock Email Sender. In production, configure SMTP credentials."""
        print(f"\n[EMAIL SENT to {to_email}] Subject: {subject}\nBody: {body}\n")
        # Real implementation:
        # msg = EmailMessage()
        # msg.set_content(body)
        # msg['Subject'] = subject
        # msg['From'] = "alerts@deepdive.com"
        # msg['To'] = to_email
        # with smtplib.SMTP('smtp.sendgrid.net', 587) as server:
        #     server.login('apikey', 'YOUR_SENDGRID_KEY')
        #     server.send_message(msg)

    def send_sms(self, to_phone, body):
        """Mock SMS Sender. In production, use Twilio API."""
        print(f"\n[SMS SENT to {to_phone}] Body: {body}\n")
        # Real implementation:
        # from twilio.rest import Client
        # client = Client('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN')
        # client.messages.create(body=body, from_='+1234567890', to=to_phone)

    def trigger_alert(self, alert, current_price, trigger_type):
        symbol = alert['symbol']
        body = f"DeepDive Alert: {symbol} has hit your {trigger_type} level. Current Price: Rs {current_price}."
        
        if alert.get('email'):
            self.send_email(alert['email'], f"{symbol} Price Alert!", body)
        if alert.get('phone'):
            self.send_sms(alert['phone'], body)

    def poll_prices(self):
        # We import here to avoid circular imports if needed
        from fetcher.yfinance_data import resolve_ticker, get_price_data
        
        while self.running:
            if not self.alerts:
                time.sleep(60)
                continue
                
            print(f"[AlertService] Polling prices for {len(self.alerts)} active alerts...")
            
            alerts_to_remove = []
            
            for alert in self.alerts:
                try:
                    _, ticker = resolve_ticker(alert['symbol'])
                    p = get_price_data(ticker)
                    cmp = p.get('current_price')
                    
                    if not cmp:
                        continue
                        
                    triggered = False
                    if alert['target'] and cmp >= alert['target']:
                        self.trigger_alert(alert, cmp, 'Target')
                        triggered = True
                    elif alert['sl'] and cmp <= alert['sl']:
                        self.trigger_alert(alert, cmp, 'Stop-Loss')
                        triggered = True
                    elif alert['buy'] and cmp <= alert['buy']:
                        self.trigger_alert(alert, cmp, 'Buy Zone')
                        triggered = True
                        
                    if triggered:
                        alerts_to_remove.append(alert)
                        
                except Exception as e:
                    print(f"[AlertService] Error polling {alert['symbol']}: {e}")
                    
            for a in alerts_to_remove:
                if a in self.alerts:
                    self.alerts.remove(a)
                    
            time.sleep(60) # Poll every 60 seconds

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self.poll_prices, daemon=True)
            self.thread.start()
            print("[AlertService] Background polling started.")

    def stop(self):
        self.running = False
        
alert_service = AlertService()
