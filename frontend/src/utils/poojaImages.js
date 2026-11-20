/**
 * Dynamic Pooja Image Resolver
 * Maps backend pooja items dynamically to distinct sacred illustrations
 */

const POOJA_IMAGE_MAP = {
  ganesh: require('../../assets/services/pooja_ganesh.png'),
  shiv: require('../../assets/services/pooja_shiv.png'),
  durga: require('../../assets/services/pooja_durga.png'),
  satyanarayan: require('../../assets/services/pooja_satyanarayan.png'),
  lakshmi: require('../../assets/services/pooja_lakshmi.png'),
  griha_pravesh: require('../../assets/services/pooja_griha_pravesh.png'),
  havan: require('../../assets/services/pooja_havan.png'),
  navgraha: require('../../assets/services/horoscope.png'),
  hanuman: require('../../assets/services/bhajan_mandal.png'),
  vivah: require('../../assets/services/bhavya_ayojana.png'),
  temple: require('../../assets/services/darshan_booking.png'),
};

export function getPoojaImage(pooja) {
  if (!pooja) return POOJA_IMAGE_MAP.temple;

  // If pooja already has a valid image requirement/object
  if (pooja.image && typeof pooja.image === 'object' && pooja.image.uri) {
    return pooja.image;
  }
  if (typeof pooja.image === 'number' && pooja.image !== POOJA_IMAGE_MAP.temple) {
    return pooja.image;
  }

  const nameStr = String(pooja.name || pooja.title || pooja.slug || pooja.id || '').toLowerCase();

  // 1. Ganesh Puja & Havan
  if (nameStr.includes('ganesh') && !nameStr.includes('havan') && !nameStr.includes('lakshmi')) {
    return POOJA_IMAGE_MAP.ganesh;
  }

  // 2. Shiv Puja, Mahadev, Rudrabhishek
  if (nameStr.includes('shiv') || nameStr.includes('rudra') || nameStr.includes('mahadev')) {
    return POOJA_IMAGE_MAP.shiv;
  }

  // 3. Durga Puja, Navratri, Chandi, Shakti
  if (nameStr.includes('durga') || nameStr.includes('navratri') || nameStr.includes('chandi')) {
    return POOJA_IMAGE_MAP.durga;
  }

  // 4. Satyanarayan Katha & Puja, Vishnu, Krishna
  if (nameStr.includes('satyanarayan') || nameStr.includes('vishnu') || nameStr.includes('krishna') || nameStr.includes('janmashtami')) {
    return POOJA_IMAGE_MAP.satyanarayan;
  }

  // 5. Lakshmi Puja, Lakshmi Ganesh, Diwali, Wealth
  if (nameStr.includes('lakshmi') || nameStr.includes('laxmi') || nameStr.includes('diwali') || nameStr.includes('kuber')) {
    return POOJA_IMAGE_MAP.lakshmi;
  }

  // 6. Griha Pravesh & Vastu Shanti
  if (nameStr.includes('griha') || nameStr.includes('pravesh') || nameStr.includes('vastu') || nameStr.includes('housewarming')) {
    return POOJA_IMAGE_MAP.griha_pravesh;
  }

  // 7. Havan, Yajna, Jaap, Maha Mrityunjaya
  if (nameStr.includes('havan') || nameStr.includes('yajna') || nameStr.includes('yagya') || nameStr.includes('mrityunjaya') || nameStr.includes('jaap')) {
    return POOJA_IMAGE_MAP.havan;
  }

  // 8. Navgraha, Shanti, Dosha (Kaal Sarp, Rahu Ketu, Mangal, Pitra)
  if (nameStr.includes('graha') || nameStr.includes('shanti') || nameStr.includes('dosha') || nameStr.includes('sarp') || nameStr.includes('rahu') || nameStr.includes('ketu') || nameStr.includes('mangal') || nameStr.includes('pitra')) {
    return POOJA_IMAGE_MAP.navgraha;
  }

  // 9. Hanuman, Sunderkand
  if (nameStr.includes('hanuman') || nameStr.includes('sunderkand') || nameStr.includes('bajrang')) {
    return POOJA_IMAGE_MAP.hanuman;
  }

  // 10. Vivah, Roka, Engagement, Grand Event
  if (nameStr.includes('vivah') || nameStr.includes('engagement') || nameStr.includes('roka') || nameStr.includes('marriage') || nameStr.includes('bhavya')) {
    return POOJA_IMAGE_MAP.vivah;
  }

  return POOJA_IMAGE_MAP.temple;
}

export default getPoojaImage;
