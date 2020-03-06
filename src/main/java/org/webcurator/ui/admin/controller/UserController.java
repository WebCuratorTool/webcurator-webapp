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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Scope;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.ModelAndView;
import org.webcurator.core.agency.AgencyUserManager;
import org.webcurator.auth.AuthorityManager;
import org.webcurator.core.util.AuthUtil;
import org.webcurator.domain.model.auth.Agency;
import org.webcurator.domain.model.auth.Privilege;
import org.webcurator.domain.model.auth.User;
import org.webcurator.ui.admin.command.UserCommand;
import org.webcurator.common.ui.Constants;
/**
 * Manages the User Administration view and the actions associated with a User
 * @author bprice
 */
@Controller
@Scope(BeanDefinition.SCOPE_SINGLETON)
@Lazy(false)
public class UserController {
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
    public UserController() {
        log = LogFactory.getLog(UserController.class);
    }

    @RequestMapping(method = RequestMethod.GET, path = "/curator/admin/user.html")
    protected ModelAndView showForm(HttpServletRequest aReq) throws Exception {
        ModelAndView mav = new ModelAndView();
        String agencyFilter = (String)aReq.getSession().getAttribute(UserCommand.MDL_AGENCYFILTER);
        if(agencyFilter == null)
        {
        	agencyFilter = AuthUtil.getRemoteUserObject().getAgency().getName();
        }
        mav.addObject(UserCommand.MDL_AGENCYFILTER, agencyFilter);
        populateUserList(mav);
        return mav;
    }

    @RequestMapping(method = RequestMethod.POST, path = "/curator/admin/user.html")
    protected ModelAndView processFormSubmission(HttpServletRequest aReq, @ModelAttribute UserCommand userCommand, BindingResult bindingResult)
            throws Exception {

        ModelAndView mav = new ModelAndView();
        if (userCommand != null) {

            if (UserCommand.ACTION_STATUS.equals(userCommand.getCmd())) {
                //Attempt to change the status of the user

                Long userOid = userCommand.getOid();
                User user = agencyUserManager.getUserByOid(userOid);
                agencyUserManager.modifyUserStatus(user);
                populateUserList(mav);
            } else if (UserCommand.ACTION_MANAGE_ROLES.equals(userCommand.getCmd())) {
                //Display the Manage User Roles screen
                populateUserList(mav);
            } else if (UserCommand.ACTION_DELETE.equals(userCommand.getCmd())) {
                // Attempt to delete a user from the system
                Long userOid = userCommand.getOid();
                User user = agencyUserManager.getUserByOid(userOid);
                String username = user.getUsername();
                try {
                    agencyUserManager.deleteUser(user);
                } catch (DataAccessException e) {
                    String[] codes = {"user.delete.fail"};
                    Object[] args = new Object[1];
                    args[0] = user.getUsername();
                    if (bindingResult == null) {
                        bindingResult = new BindException(userCommand, "command");
                    }
                    bindingResult.addError(new ObjectError("command",codes,args,"User owns objects in the system and can't be deleted."));
                    mav.addObject(Constants.GBL_ERRORS, bindingResult);
                    populateUserList(mav);
                    return mav;
                }
                populateUserList(mav);
                mav.addObject(Constants.GBL_MESSAGES, messageSource.getMessage("user.deleted", new Object[] { username }, Locale.getDefault()));
            } else if (UserCommand.ACTION_FILTER.equals(userCommand.getCmd())) {
                //Just filtering users by agency - if we change the default, store it in a session
            	aReq.getSession().setAttribute(UserCommand.MDL_AGENCYFILTER, userCommand.getAgencyFilter());
                populateUserList(mav);
            }
        } else {
            log.warn("No Action provided for UserController.");
            populateUserList(mav);
        }

        String agencyFilter = (String)aReq.getSession().getAttribute(UserCommand.MDL_AGENCYFILTER);
        if(agencyFilter == null)
        {
        	agencyFilter = AuthUtil.getRemoteUserObject().getAgency().getName();
        }
        mav.addObject(UserCommand.MDL_AGENCYFILTER, agencyFilter);
        return mav;
    }

    /**
     * Populate the user list model object in the model and view provided.
     * @param mav the model and view to add the user list to.
     */
    @SuppressWarnings("unchecked")
    private void populateUserList(ModelAndView mav) {
        List userDTOs = agencyUserManager.getUserDTOsForLoggedInUser();
        List agencies = null;
        if (authorityManager.hasPrivilege(Privilege.MANAGE_USERS, Privilege.SCOPE_ALL)) {
        	agencies = agencyUserManager.getAgencies();
        } else {
            User loggedInUser = AuthUtil.getRemoteUserObject();
            Agency usersAgency = loggedInUser.getAgency();
            agencies = new ArrayList<Agency>();
            agencies.add(usersAgency);
        }

        mav.addObject(UserCommand.MDL_USERS, userDTOs);
        mav.addObject(UserCommand.MDL_LOGGED_IN_USER, AuthUtil.getRemoteUserObject());
        mav.addObject(UserCommand.MDL_AGENCIES, agencies);
        mav.setViewName("viewUsers");
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
