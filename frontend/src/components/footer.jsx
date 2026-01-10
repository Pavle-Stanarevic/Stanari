import "../styles/footer.css";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer id="footer">

        <div className="social-icons">
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer">
            <FaFacebook />
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
            <FaInstagram />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer">
            <FaTiktok />
          </a>
        </div>

        <div className="underline-footer"></div>
        <div className="copyright">@ 2026, ClayPlay</div>
    </footer>
  );
}
