import { useTranslation } from 'react-i18next';
import banderaEspaña from '@/assets/banderaEspaña.png';
import banderaInglesa from '@/assets/banderaInglesa.png';
import './botonIdioma.css';

function BotonIdioma() {
    const { i18n } = useTranslation();
    const esEspanol = i18n.language === 'es';

    return (
        <button
            className="btn-idioma"
            onClick={() => i18n.changeLanguage(esEspanol ? 'en' : 'es')}
            title={esEspanol ? 'Switch to English' : 'Cambiar a Español'}
        >
            <img
                src={esEspanol ? banderaInglesa : banderaEspaña}
                alt={esEspanol ? 'English' : 'Español'}
                className="bandera-idioma"
            />
        </button>
    );
}

export default BotonIdioma;