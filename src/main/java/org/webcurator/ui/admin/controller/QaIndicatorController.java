/*
 *  Copyright 2006 The National Library of New Zealand
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package org.webcurator.ui.admin.controller;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.propertyeditors.CustomNumberEditor;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Scope;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import org.webcurator.auth.AuthorityManager;
import org.webcurator.core.agency.AgencyUserManager;
import org.webcurator.core.util.AuthUtil;
import org.webcurator.domain.model.auth.Agency;
import org.webcurator.domain.model.auth.Privilege;
import org.webcurator.domain.model.auth.User;
import org.webcurator.domain.model.core.IndicatorCriteria;
import org.webcurator.ui.admin.command.QaIndicatorCommand;
import org.webcurator.common.ui.Constants;
/**
 * Manages the QA Indicator Administration view and the actions associated with a IndicatorCriteria
 * @author twoods
 */
@Controller
@Scope(BeanDefinition.SCOPE_SINGLETON)
@Lazy(false)
@RequestMapping("/curator/admin/qaindicators.html")
public class QaIndicatorController {
	/** the logger. */
    private Log log = null;
    /** the agency user manager. */
    @Autowired
    private AgencyUserManager agencyUserManager;
    /** the authority manager. */
    @Autowired
    private AuthorityManager authorityManager;
    /** the message source. */
    @Autowired
    private MessageSource messageSource;
    /** Default Constructor. */
    public QaIndicatorController() {
        log = LogFactory.getLog(QaIndicatorController.class);
    }

    @InitBinder
    protected void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) {
    	// enable null values for long and float fields
        NumberFormat nf = NumberFormat.getInstance(request.getLocale());
        NumberFormat floatFormat = new DecimalFormat("##############.##");
        binder.registerCustomEditor(java.lang.Long.class, new CustomNumberEditor(java.lang.Long.class, nf, true));
        binder.registerCustomEditor(java.lang.Float.class, new CustomNumberEditor(java.lang.Float.class, nf, true));
   }

    @GetMapping
    protected ModelAndView showForm(HttpServletRequest aReq) throws Exception {
        ModelAndView mav = new ModelAndView();
        String agencyFilter = (String)aReq.getSession().getAttribute(QaIndicatorCommand.MDL_AGENCYFILTER);
        if(agencyFilter == null)
        {
        	agencyFilter = AuthUtil.getRemoteUserObject().getAgency().getName();
        }
        mav.addObject(QaIndicatorCommand.MDL_AGENCYFILTER, agencyFilter);
        populateIndicatorCriteriaList(mav);
        return mav;
    }

    @PostMapping
    protected ModelAndView processFormSubmission(HttpServletRequest aReq, QaIndicatorCommand qaIndicatorCmd, BindingResult bindingResult)
            throws Exception {

        ModelAndView mav = new ModelAndView();
        if (qaIndicatorCmd != null) {

        	if (QaIndicatorCommand.ACTION_DELETE.equals(qaIndicatorCmd.getCmd())) {
                // Attempt to delete a indicator criteria from the system
                Long oid = qaIndicatorCmd.getOid();
                IndicatorCriteria indicatorCriteria = agencyUserManager.getIndicatorCriteriaByOid(oid);
                String name = indicatorCriteria.getName();
                try {
                    agencyUserManager.deleteIndicatorCriteria(indicatorCriteria);
                } catch (DataAccessException e) {
                    String[] codes = {"indicatorcriteria.delete.fail"};
                    Object[] args = new Object[1];
                    args[0] = indicatorCriteria.getName();
                    if (bindingResult == null) {
                        bindingResult = new BindException(qaIndicatorCmd, "command");
                    }
                    bindingResult.addError(new ObjectError("command",codes,args,"QA Indicator owns objects in the system and can't be deleted."));
                    mav.addObject(Constants.GBL_ERRORS, bindingResult);
                    populateIndicatorCriteriaList(mav);
                    return mav;
                }
                populateIndicatorCriteriaList(mav);
                mav.addObject(Constants.GBL_MESSAGES, messageSource.getMessage("indicatorcriteria.deleted", new Object[] { name }, Locale.getDefault()));
            } else if (QaIndicatorCommand.ACTION_FILTER.equals(qaIndicatorCmd.getCmd())) {
                //Just filtering reasons by agency - if we change the default, store it in the session
            	aReq.getSession().setAttribute(QaIndicatorCommand.MDL_AGENCYFILTER, qaIndicatorCmd.getAgencyFilter());
            	populateIndicatorCriteriaList(mav);
            }
        } else {
            log.warn("No Action provided for QaIndicatorController.");
            populateIndicatorCriteriaList(mav);
        }

        String agencyFilter = (String)aReq.getSession().getAttribute(QaIndicatorCommand.MDL_AGENCYFILTER);
        if(agencyFilter == null)
        {
        	agencyFilter = AuthUtil.getRemoteUserObject().getAgency().getName();
        }
        mav.addObject(QaIndicatorCommand.MDL_AGENCYFILTER, agencyFilter);
        return mav;
    }

    /**
     * Populate the Indicator Criteria list model object in the model and view provided.
     * @param mav the model and view to add the user list to.
     */
    @SuppressWarnings("unchecked")
    private void populateIndicatorCriteriaList(ModelAndView mav) {
        List<IndicatorCriteria> indicators = agencyUserManager.getIndicatorCriteriaForLoggedInUser();
        List<Agency> agencies = null;
        if (authorityManager.hasPrivilege(Privilege.MANAGE_INDICATORS, Privilege.SCOPE_ALL)) {
        	agencies = agencyUserManager.getAgencies();
        } else {
            User loggedInUser = AuthUtil.getRemoteUserObject();
            Agency usersAgency = loggedInUser.getAgency();
            agencies = new ArrayList<Agency>();
            agencies.add(usersAgency);
        }

        mav.addObject(QaIndicatorCommand.MDL_QA_INDICATORS, indicators);
        mav.addObject(QaIndicatorCommand.MDL_LOGGED_IN_USER, AuthUtil.getRemoteUserObject());
        mav.addObject(QaIndicatorCommand.MDL_AGENCIES, agencies);
        mav.setViewName("viewIndicators");
    }

    /**
     * @param agencyUserManager the agency user manager.
     */
    public void setAgencyUserManager(AgencyUserManager agencyUserManager) {
        this.agencyUserManager = agencyUserManager;
    }

    /**
     * @param messageSource the message source.
     */
    public void setMessageSource(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /**
	 * Spring setter method for the Authority Manager.
	 * @param authorityManager The authorityManager to set.
	 */
	public void setAuthorityManager(AuthorityManager authorityManager) {
		this.authorityManager = authorityManager;
	}
}
