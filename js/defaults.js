/*
 * Built-in content. The site shows this straight away, then replaces it
 * with whatever is saved in Supabase through the admin panel.
 * If Supabase is ever unreachable, visitors still see this version.
 */
window.NOVELTY_DEFAULTS = {
  settings: {
    hero: {
      badge: "New Year 2027 Celebrations",
      pre_title: "Ride into 2027 with",
      brand_1: "NOVELTY",
      brand_2: "OLA",
      sub_line: "Punjab's Ola Electric dealer · 17 outlets · 11 cities",
      lead: "Your new Ola is waiting at Novelty Ola. Walk into your nearest outlet for New Year offers, easy EMI, a fair exchange on your old two-wheeler and a free test ride, with service handled by our own team after you ride home.",
      trust: ["17 outlets in 11 cities", "Free test ride", "Easy EMI", "Service under one roof"],
      cta_primary: "Get New Year Offer →",
      cta_secondary: "Find your Novelty Ola outlet",
      tag_title: "New Year deliveries",
      tag_sub: "Book now at Novelty Ola",
      big_text: "2027",
      countdown_on: true,
      countdown_label: "Countdown to 2027",
      countdown_target: "2027-01-01T00:00:00+05:30",
      countdown_done: "Happy New Year 2027!",
      popup_title: "New Year offers on your new Ola",
      popup_sub: "Share your details and our team will call you with the best price, EMI and exchange offer.",
      popup_auto_open: true,
      popup_delay_seconds: 2.5
    },
    business: {
      phone_display: "+91 7665004458",
      phone: "917665004458",
      whatsapp: "919876504546",
      address: "Batala Road, Opposite Bank of India, Vijay Nagar, Opposite Pillar No. 20, Amritsar, Punjab 143001",
      hours: "10:00 AM – 7:00 PM",
      outlet_numbers: "Jalandhar: 76650 04436\nAll other outlets: 76650 04458",
      outlets_count: "17",
      cities_count: "11",
      about_title: "A name Punjab already trusts, now electric.",
      about_p1: "Novelty Group has sold and serviced vehicles across Punjab for years through Novelty Tata, Novelty Hyundai, Novelty Mahindra and our TVS and Ather two-wheeler outlets.",
      about_p2: "Novelty Ola brings that same team and that same after-sales care to Ola Electric. Walk in for a test ride, get finance and insurance done at the counter, and ride home the same week.",
      models_note: "Starting prices are ex-showroom. Monthly EMI amounts are indicative and depend on the finance scheme, down payment and tenure. Prices, offers and EMI are subject to change, so ask us for today's on-road price."
    },
    integrations: {
      google_script_url: "https://script.google.com/macros/s/AKfycbwlc95V4DsDLvJzQarfW_qpt-UPcuy61Hm5PESaZnJnOB_tr20HwR48snmxBgY_41yQ1A/exec"
    },
    seo: {
      title: "Novelty Ola",
      description: "Novelty Ola — authorised Ola Electric dealer in Punjab. Ola S1 scooters and Roadster motorcycles, test rides, finance and service across 17 outlets in 11 cities."
    }
  },
  models: [
    { name: "S1 Pro+",     type: "scooter", is_gen3: true,  tagline: "Our most powerful scooter yet",      emi: "2,870", price: "1,49,999", image_url: "/assets/models/s1-pro-plus.jpg",     show_in_hero: true },
    { name: "S1 Pro",      type: "scooter", is_gen3: true,  tagline: "Pure Power. Peak Performance",       emi: "2,237", price: "1,30,999", image_url: "/assets/models/s1-pro.jpg",          show_in_hero: true },
    { name: "S1 X+",       type: "scooter", is_gen3: true,  tagline: "Scooter for every Indian",           emi: "1,831", price: "1,21,999", image_url: "/assets/models/s1-x-plus.jpg",       show_in_hero: true },
    { name: "S1 X",        type: "scooter", is_gen3: true,  tagline: "Upgrade to electric with style",     emi: "1,584", price: "80,999",   image_url: "/assets/models/s1-x.jpg",            show_in_hero: true },
    { name: "S1 Z",        type: "scooter", is_gen3: false, tagline: "Zyada in every aspect",              emi: "",      price: "79,999",   image_url: "/assets/models/s1-z.jpg",            show_in_hero: true },
    { name: "Roadster X",  type: "bike",    is_gen3: false, tagline: "Upgrade to electric with style",     emi: "",      price: "95,280",   image_url: "/assets/models/roadster-x.jpg",      show_in_hero: true },
    { name: "Roadster X+", type: "bike",    is_gen3: false, tagline: "India's ultimate electric upgrade",  emi: "",      price: "1,23,999", image_url: "/assets/models/roadster-x-plus.jpg", show_in_hero: false }
  ],
  outlets: [
    { city: "Amritsar",   area: "Flagship showroom · Batala Road, Vijay Nagar", phone: "7665004458", is_flagship: true },
    { city: "Jalandhar",  area: "", phone: "7665004436" },
    { city: "Ludhiana",   area: "", phone: "7665004458" },
    { city: "Batala",     area: "", phone: "7665004458" },
    { city: "Tarn Taran", area: "", phone: "7665004458" },
    { city: "Hoshiarpur", area: "", phone: "7665004458" },
    { city: "Kapurthala", area: "", phone: "7665004458" },
    { city: "Moga",       area: "", phone: "7665004458" },
    { city: "Khanna",     area: "", phone: "7665004458" },
    { city: "Jagraon",    area: "", phone: "7665004458" },
    { city: "Samrala",    area: "", phone: "7665004458" }
  ],
  faqs: [
    { question: "Can I charge an Ola at home?", answer: "Yes. Ola scooters and motorcycles charge from a regular home socket with the charger provided. Most riders charge overnight, the same way they charge a phone." },
    { question: "How much does it cost to run an Ola?", answer: "Usually a fraction of petrol. Use the savings calculator above with your own daily distance and electricity rate for an estimate." },
    { question: "Do you offer finance and EMI?", answer: "Yes. We arrange finance with leading banks and NBFCs at the showroom. Bring your Aadhaar, PAN and address proof and we'll handle the rest." },
    { question: "Can I exchange my petrol scooter?", answer: "Yes. Bring your old two-wheeler to any Novelty Ola outlet. We'll value it on the spot and adjust it against your new Ola." },
    { question: "What about the warranty on the battery?", answer: "Battery and vehicle warranty depends on the model and variant you choose. Our team will walk you through the exact coverage before you book." },
    { question: "Where do I get my Ola serviced?", answer: "Novelty Ola handles periodic service, software updates and repairs. Book a service through the form below or call us." }
  ],
  services: [
    { title: "Free test rides", description: "Ride any model at the showroom before you decide.", icon: "testride" },
    { title: "Easy finance & EMI", description: "Low down payment options with leading banks and NBFCs, with paperwork done at the counter.", icon: "finance" },
    { title: "Exchange your old two-wheeler", description: "Fair value for your petrol scooter or bike, adjusted against your new Ola.", icon: "exchange" },
    { title: "Insurance", description: "New policies at delivery and hassle-free renewals every year.", icon: "insurance" },
    { title: "Service & repairs", description: "Periodic service, software updates and battery health checks by trained technicians.", icon: "service" },
    { title: "Home charging setup", description: "We explain charging, the Ola app and every riding mode on delivery day.", icon: "charging" }
  ]
};

/* Line icons for the Services section (also used in the admin panel) */
window.NOVELTY_ICONS = {
  testride:  '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7h4"/>',
  finance:   '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
  exchange:  '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M20 4v5h-5M4 20v-5h5"/>',
  insurance: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  service:   '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z"/>',
  charging:  '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  offer:     '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  star:      '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
};
