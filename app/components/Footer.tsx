import {NavLink, type MetaFunction, Link} from '@remix-run/react';
import parse from 'html-react-parser';
import '../styles/pages.css';
import contentstack_logo from '../../public/cms_white_logo.svg';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

const MENU_ORDER = ['product_menu', 'collection_menu', 'company_menu'];

const MenuSection = ({
  field,
  titleKey,
  headingClass,
}: {
  field: any;
  titleKey: string;
  headingClass: string;
}) => {
  const fields = field?.reference?.fields || [];
  let titleField: any;
  let subMenuField: any;
  fields.forEach((f: any) => {
    switch (f.key) {
      case titleKey:
        titleField = f;
        break;
      case 'sub_menu':
        subMenuField = f;
        break;
      default:
        break;
    }
  });

  return (
    <div key={field.key}>
      {titleField && <h2 className={headingClass}>{titleField.value}</h2>}
      {subMenuField &&
        Array.isArray(subMenuField.references?.nodes) &&
        subMenuField.references.nodes.map((sub_menu: any) => {
          let urlField: any;
          let titleField: any;
          let newTabField: any;
          sub_menu.fields.forEach((f: any) => {
            switch (f?.key) {
              case 'url':
                urlField = f;
                break;
              case 'title':
                titleField = f;
                break;
              case 'open_in_new_tab':
                newTabField = f;
            }
          });

          return (
            <div key={sub_menu.id}>
              <ul>
                <li>
                  <Link
                    to={urlField?.value}
                    prefetch="intent"
                    target={newTabField?.value === 'true' ? '_blank' : '_self'}
                  >
                    {titleField?.value}
                  </Link>
                </li>
              </ul>
            </div>
          );
        })}
    </div>
  );
};

export function Footer(fetchdata: any) {
  const footerMetaObject = fetchdata?.footerMetaObject;
  const footerData = footerMetaObject?.metaobjects?.nodes?.[0]?.fields;
  const sortedFooterData = footerData.sort((a: any, b: any) => {
    return MENU_ORDER.indexOf(a.key) - MENU_ORDER.indexOf(b.key);
  });

  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="row footer-row">
          <div className="footer-col-left">
            {Array.isArray(footerData) &&
              footerData.map((field: any) => {
                if (field?.key === 'subscribe') {
                  const subscribeFields = field?.reference.fields;

                  // Initialize variables to store the elements
                  let subscribeMessage = null;
                  let subscribeDescription = null;
                  let mailPlaceholderText = null;
                  subscribeFields.forEach((subscribe: any) => {
                    switch (subscribe?.key) {
                      case 'subscribe_message':
                        subscribeMessage = (
                          <h2
                            key="subscribe_message"
                            className="footer-heading"
                          >
                            {subscribe?.value}
                          </h2>
                        );
                        break;
                      case 'subscribe_description':
                        subscribeDescription = (
                          <p
                            key="subscribe_description"
                            className="footer-info"
                          >
                            {subscribe?.value}
                          </p>
                        );
                        break;
                      case 'mail_placeholder_text':
                        mailPlaceholderText = (
                          <div>
                            <input
                              className="footer-email input-field"
                              type="email"
                              placeholder={subscribe?.value}
                            />
                            <a
                              href="/account/login"
                              rel="noreferrer"
                              className="offers-cta"
                              target={'_self'}
                            >
                              SUBSCRIBE
                            </a>
                          </div>
                        );
                        break;
                      default:
                        break;
                    }
                  });

                  return (
                    <>
                      {subscribeMessage}
                      {subscribeDescription}
                      {mailPlaceholderText}
                    </>
                  );
                }
                return null;
              })}
          </div>
          <div className="footer-col-right">
            <div className="footer-products-wrap">
              {Array.isArray(sortedFooterData) &&
                sortedFooterData.map((field: any) => {
                  if (
                    [
                      'product_menu',
                      'collection_menu',
                      'company_menu',
                    ].includes(field.key)
                  ) {
                    const titleKey =
                      field.key === 'product_menu' ? 'menu_title' : 'heading';
                    const headingClass = 'footer-product-heading';
                    return (
                      <MenuSection
                        key={field.key}
                        field={field}
                        titleKey={titleKey}
                        headingClass={headingClass}
                      />
                    );
                  }
                  return null;
                })}
            </div>
          </div>
        </div>
        <div className="footer-logo-wrap">
          <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
            <img alt="contentstack" src={contentstack_logo} height="30px" />
          </NavLink>
          <div className="footer_social_logos">
            {Array.isArray(footerData) &&
              footerData.map((field: any) => {
                if (field?.key === 'social_icon') {
                  return field?.references?.nodes.map((node: any) => {
                    let url = '';
                    let title = '';
                    let openInNewTab = false;
                    let iconSrc = '';

                    node.fields.forEach((f: any) => {
                      switch (f.key) {
                        case 'icon':
                          iconSrc = f.reference?.image.url;
                          break;
                        case 'menu':
                          f.reference?.fields.forEach((menuField: any) => {
                            switch (menuField.key) {
                              case 'url':
                                url = menuField.value;
                                break;
                              case 'title':
                                title = menuField.value;
                                break;
                              case 'open_in_new_tab':
                                openInNewTab = menuField.value === 'true';
                                break;
                              default:
                                break;
                            }
                          });
                          break;
                        default:
                          break;
                      }
                    });

                    return (
                      <a
                        key={title}
                        href={url}
                        rel="noreferrer"
                        target={openInNewTab ? '_blank' : '_self'}
                      >
                        <img
                          src={iconSrc}
                          alt={title}
                          width="24"
                          height="24"
                          className="footer_social_logos_img"
                        />
                      </a>
                    );
                  });
                }
                return null; // Return null if the key is not 'social_icon'
              })}
          </div>
        </div>
        <div className="footer-copyright-sec">
          {Array.isArray(footerData) && (
            <>
              {footerData.map((item: any, index: number) => {
                if (item.key === 'copyright') {
                  return <p key={index}>{parse(item?.value || '')}</p>;
                }
                return null;
              })}
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}
