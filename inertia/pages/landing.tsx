import { ReactElement } from 'react'
import { Link } from '@adonisjs/inertia/react'
import {
  IconArrowRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandX,
  IconBuildingCommunity,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconPlayerPlay,
  IconRipple,
  IconUsers,
} from '@tabler/icons-react'

const heroImage =
  'https://images.pexels.com/photos/31522680/pexels-photo-31522680.jpeg?auto=compress&cs=tinysrgb&w=1200'
const instructorImage =
  'https://images.pexels.com/photos/6011945/pexels-photo-6011945.jpeg?auto=compress&cs=tinysrgb&w=1000'
const lessonImage =
  'https://images.pexels.com/photos/346780/pexels-photo-346780.jpeg?auto=compress&cs=tinysrgb&w=1000'
const swimmerImage =
  'https://images.pexels.com/photos/346776/pexels-photo-346776.jpeg?auto=compress&cs=tinysrgb&w=800'

function CheckItem({ children }: { children: string }) {
  return (
    <div className="landing-check">
      <span className="landing-check-icon">
        <IconCheck size={14} stroke={2.4} />
      </span>
      {children}
    </div>
  )
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <div className={footer ? 'landing-foot-brand' : 'landing-brand'}>
      <span className="landing-logo">
        <IconRipple size={18} stroke={2.1} />
      </span>
      Swimclass Manager
    </div>
  )
}

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-wrap landing-nav-inner">
          <Brand />
          <nav className="landing-nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
            <a href="#resources">
              Resources <IconChevronDown size={14} stroke={2} />
            </a>
          </nav>
          <div className="landing-nav-right">
            <Link route="sign_in_links.create" className="landing-btn landing-btn-ghost">
              Login
            </Link>
            <Link route="account_registrations.create" className="landing-btn landing-btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-wrap landing-hero-grid">
            <div>
              <span className="landing-eyebrow">Seamless Swim School Management</span>
              <h1>
                Bring order to the <span>chaos</span> of managing swim class.
              </h1>
              <p className="landing-lead">
                The all-in-one platform built specifically for swim schools and instructors across
                Ghana. Streamline scheduling, automate parent communication, and focus on teaching
                life-saving skills.
              </p>
              <div className="landing-actions">
                <Link
                  route="account_registrations.create"
                  className="landing-btn landing-btn-primary landing-btn-large"
                >
                  Start Your Free Trial <IconArrowRight size={18} stroke={2} />
                </Link>
                <a className="landing-btn landing-btn-outline landing-btn-large" href="#demo">
                  <IconPlayerPlay size={17} fill="currentColor" stroke={0} /> Watch Demo
                </a>
              </div>
            </div>

            <div className="landing-hero-art">
              <div className="landing-art-card">
                <img
                  src={heroImage}
                  alt="Swim instructor guiding a young child learning to swim"
                  loading="eager"
                />
              </div>
              <div className="landing-float-badge">
                <span className="landing-float-icon">
                  <IconRipple size={18} stroke={2} />
                </span>
                <span>
                  <strong>Morning Drills</strong>
                  <small>8 students - 08:00 AM</small>
                </span>
                <em>In Progress</em>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-block landing-band" id="features">
          <div className="landing-wrap landing-split">
            <div className="landing-art-card">
              <img src={instructorImage} alt="Instructor teaching a child to swim" loading="lazy" />
            </div>
            <div>
              <span className="landing-kicker">
                <IconUsers size={23} stroke={1.9} />
              </span>
              <h2>Complete management for everyone involved.</h2>
              <p>
                Stop juggling spreadsheets and paper forms. Manage swimmers, parents, and
                instructors from one calm, organized dashboard.
              </p>
              <div className="landing-checks">
                <CheckItem>Digital attendance and check-ins</CheckItem>
                <CheckItem>Instructor scheduling and payroll sync</CheckItem>
                <CheckItem>Secure parent database and billing history</CheckItem>
                <CheckItem>Class capacity management and waitlists</CheckItem>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-block">
          <div className="landing-wrap landing-split">
            <div>
              <span className="landing-kicker">
                <IconClock size={23} stroke={1.9} />
              </span>
              <h2>Spend more time on skills, less on paperwork.</h2>
              <p>
                Automation handles tedious admin tasks so instructors can focus on students in the
                water. Improving technique should not be slowed down by logistics.
              </p>
              <div className="landing-stats">
                <div>
                  <strong>30%</strong>
                  <span>Increase in instructor efficiency</span>
                </div>
                <div>
                  <strong>15 hrs</strong>
                  <span>Saved per week on admin tasks</span>
                </div>
              </div>
            </div>
            <div className="landing-art-card">
              <img src={lessonImage} alt="Instructor and child during a swimming lesson" loading="lazy" />
            </div>
          </div>
        </section>

        <section className="landing-block landing-band">
          <div className="landing-wrap landing-split">
            <div className="landing-phone-stage">
              <div className="landing-phone">
                <img src={swimmerImage} alt="Young swimmer in goggles enjoying the pool" loading="lazy" />
                <div className="landing-phone-body">
                  <strong>Shaun - Level 3</strong>
                  <span>Mastered freestyle breathing today</span>
                  <div>
                    <em>
                      <IconCheck size={15} stroke={2.4} />
                    </em>
                    <span>
                      <b>Skill Achievement Alert</b>
                      <small>New stroke unlocked - see progress</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="landing-kicker">
                <IconMessageCircle size={23} stroke={1.9} />
              </span>
              <h2>Keeps parents updated and engaged.</h2>
              <p>
                Trust is built on transparency. Share progress reports, skill milestones, and
                schedule changes directly with parents.
              </p>
              <div className="landing-feature-card">
                <span>🏅</span>
                <div>
                  <strong>Skill Achievement Alerts</strong>
                  <small>Notify parents when a child masters a new stroke.</small>
                </div>
              </div>
              <div className="landing-feature-card">
                <span>💬</span>
                <div>
                  <strong>In-App Messaging</strong>
                  <small>Secure communication between instructors and parents.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-block" id="pricing">
          <div className="landing-wrap">
            <div className="landing-center">
              <span className="landing-eyebrow">Pricing Plans</span>
              <h2>Simple plans for every swim school.</h2>
              <p>
                Choose the plan that fits your current needs. Plans are billed annually and can
                grow with your school.
              </p>
            </div>
            <div className="landing-plans">
              <article className="landing-plan">
                <h3>Basic</h3>
                <p>For small schools and solo instructors.</p>
                <div className="landing-price">
                  <span>GHS</span>49<small>/month</small>
                </div>
                <em>Billed annually at GHS 588/year</em>
                <div className="landing-checks">
                  <CheckItem>Up to 50 active students</CheckItem>
                  <CheckItem>5 instructor profiles</CheckItem>
                  <CheckItem>Basic class scheduling</CheckItem>
                  <CheckItem>Parent contact directory</CheckItem>
                  <CheckItem>Email notifications</CheckItem>
                </div>
                <Link route="account_registrations.create" className="landing-btn landing-btn-outline">
                  Start Basic Trial
                </Link>
              </article>
              <article className="landing-plan landing-plan-pro">
                <span className="landing-popular">Most Popular</span>
                <h3>Pro</h3>
                <p>For growing schools with multiple instructors.</p>
                <div className="landing-price">
                  <span>GHS</span>99<small>/month</small>
                </div>
                <em>Billed annually at GHS 1,188/year</em>
                <div className="landing-checks">
                  <CheckItem>Unlimited active students</CheckItem>
                  <CheckItem>Unlimited instructor profiles</CheckItem>
                  <CheckItem>Advanced multi-lane scheduling</CheckItem>
                  <CheckItem>Automated SMS alerts</CheckItem>
                  <CheckItem>Performance and skill tracking</CheckItem>
                  <CheckItem>Custom branding</CheckItem>
                </div>
                <Link route="account_registrations.create" className="landing-btn landing-btn-primary">
                  Go Pro Now
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-block landing-band">
          <div className="landing-wrap">
            <div className="landing-center">
              <h2>Common Questions</h2>
              <p>Everything you need to know about Swimclass Manager.</p>
            </div>
            <div className="landing-faq">
              {[
                ['Is there a setup fee?', 'No, there are no hidden setup or onboarding fees.'],
                ['Can I cancel anytime?', 'Yes. You can cancel at any time.'],
                ['Does it work on tablets?', 'Yes, the interface is responsive for tablets and phones.'],
                [
                  'Is student data secure?',
                  'We use secure application patterns to protect swimmer and parent information.',
                ],
              ].map(([question, answer]) => (
                <div key={question}>
                  <h3>{question}</h3>
                  <p>{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-block" id="start">
          <div className="landing-wrap">
            <div className="landing-cta">
              <h2>Ready to transform your swim school?</h2>
              <p>
                Join swim schools across Ghana that have regained control of their schedule and
                improved parent satisfaction.
              </p>
              <div className="landing-actions landing-actions-center">
                <Link route="account_registrations.create" className="landing-btn landing-btn-light">
                  Start Your 14-Day Free Trial
                </Link>
                <a className="landing-btn landing-btn-transparent" href="#demo">
                  Schedule a Demo
                </a>
              </div>
              <small>No credit card required. Cancel anytime.</small>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer" id="contact">
        <div className="landing-wrap landing-foot-grid">
          <div>
            <Brand footer />
            <p>
              The all-in-one platform helping swim schools across Ghana teach life-saving skills
              with less admin and happier parents.
            </p>
          </div>
          <div>
            <h3>Contact Us</h3>
            <span>
              <IconBuildingCommunity size={16} /> Swimclass Manager
            </span>
            <span>
              <IconMapPin size={16} /> Kumasi, Ghana
            </span>
            <span>
              <IconMail size={16} /> support@swimclassmanager.com
            </span>
          </div>
          <div id="resources">
            <h3>Resources</h3>
            <a href="#">Help Center</a>
            <a href="#">Instructor Guide</a>
            <a href="#">Blog</a>
            <a href="#">Case Studies</a>
          </div>
          <div>
            <h3>Legal</h3>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <div className="landing-socials">
              <a href="#" aria-label="Instagram">
                <IconBrandInstagram size={18} />
              </a>
              <a href="#" aria-label="Facebook">
                <IconBrandFacebook size={18} />
              </a>
              <a href="#" aria-label="X">
                <IconBrandX size={18} />
              </a>
            </div>
          </div>
        </div>
        <div className="landing-wrap landing-foot-bottom">
          <span>© 2026 Swimclass Manager. All rights reserved.</span>
          <span>Status - Sitemap - Accessibility</span>
        </div>
      </footer>
    </div>
  )
}

;(Landing as { layout?: (page: ReactElement) => ReactElement }).layout = (page) => page

export default Landing
